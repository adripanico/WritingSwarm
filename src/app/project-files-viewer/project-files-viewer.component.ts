import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatTreeNestedDataSource} from '@angular/material';
import {ProjectFile, ProjectFiles} from '../project-files';
import {NestedTreeControl} from '@angular/cdk/tree';
import {first, flatMap, map} from 'rxjs/operators';
import {SwarmService} from '../swarm.service';
import {CollectionViewer} from '@angular/cdk/collections';
import {Observable, ReplaySubject, Subject} from 'rxjs';

@Component({
    selector: 'app-project-files-viewer',
    templateUrl: './project-files-viewer.component.html',
    styleUrls: ['./project-files-viewer.component.css']
})
export class ProjectFilesViewerComponent implements OnInit {
    @Input('rootHash')
    set _rootHash(val: string) {
        this.rootHash = val;
        if (this.rootHash !== null) {
            ProjectFiles.fromRootHash(this.rootHash, this.swarmService).then(pf => this.initFiles(pf));
        } else {
            this.projectFiles = null;
            this.currentFile = null;
        }
    }

    @Output()
    fileSelected: EventEmitter<ProjectFile> = new EventEmitter<ProjectFile>();
    @Output()
    loaded: EventEmitter<boolean> = new EventEmitter<boolean>();

    public dataSource: MatTreeNestedDataSource<ProjectFile>;
    public treeControl: NestedTreeControl<ProjectFile>;

    private rootHash: string;
    private currentFile: ProjectFile;
    private projectFiles: ProjectFiles;
    private fileMap: Map<string, Subject<ProjectFile>> = new Map<string, Subject<ProjectFile>>();

    constructor(private swarmService: SwarmService,
                private ref: ChangeDetectorRef) {
    }

    ngOnInit() {
    }

    public hasChild(_: number, projectFile: ProjectFile): boolean {
        return projectFile.type === 'directory';
    }

    private initFiles(projectFiles: ProjectFiles) {
        this.projectFiles = projectFiles;
        const regularFiles = projectFiles.files.filter(pf => pf.type === 'file');
        const projectFileObservable = projectFiles.subscribeToFilesRecursively();
        projectFileObservable.subscribe(pf => this.getFileSubject(pf.fullPath).next(pf));
        if (this.currentFile) {
            // Refreshing current file
            this.currentFile = projectFiles.findChildRecursive(this.currentFile.fullPath);
        }

        if (regularFiles.length === 1) {
            this.selectNode(regularFiles[0]);
        }
        this.dataSource = this.directoryTreeDataSource(projectFiles.files);
        this.loaded.emit(true);
        this.treeControl = new NestedTreeControl<ProjectFile>(node => {
            if (node.isDirectory()) {
                return node.children.files;
            } else {
                return null;
            }
        });

        if (this.currentFile) {
            this.currentFile.parents().forEach(parent => this.treeControl.expand(parent));
            // TODO: Observe html and expand when elements have been created
            setTimeout(() => {
                this.scrollToCurrentElement();
            }, 200);
        }
    }

    private directoryTreeDataSource(projectFiles: ProjectFile[]): MatTreeNestedDataSource<ProjectFile> {
        const matTreeNestedDataSource = new MatTreeNestedDataSource<ProjectFile>();
        matTreeNestedDataSource.data = projectFiles;
        return matTreeNestedDataSource;
        // return new LazyDirectoryDataSource(projectFiles, this.swarmService, this.rootHash);
    }

    selectNode(file: ProjectFile) {
        this.currentFile = file;
        this.fileSelected.emit(file);
    }

    public scrollToCurrentElement() {
        const element = document.querySelector('#hash_' + this.currentFile.hash);
        if (element) {
            element.scrollIntoView({block: 'end'});
        }
    }

    selectPath(fullPath: string) {
        this.observeFullPath(fullPath).pipe(first()).subscribe(pf => {
            this.selectNode(pf);
            pf.parents().forEach(parent => {
                this.treeControl.expand(parent);
            });
            setTimeout(() => {
                this.scrollToCurrentElement();
            }, 200);
            this.ref.detectChanges();
        });
    }

    private observeFullPath(fullPath: string): Observable<ProjectFile> {
        return this.getFileSubject(fullPath);
    }

    private getFileSubject(fullPath: string): Subject<ProjectFile> {
        if (!this.fileMap.has(fullPath)) {
            const fileSubject: ReplaySubject<ProjectFile> = new ReplaySubject(1);
            this.fileMap.set(fullPath, fileSubject);
        }
        return this.fileMap.get(fullPath);
    }

}

class LazyDirectoryDataSource extends MatTreeNestedDataSource<ProjectFile> {

    constructor(private projectFiles: ProjectFile[],
                private swarmService: SwarmService,
                private rootHash: string) {
        super();
        this.data = this.projectFiles;
    }


    connect(collectionViewer: CollectionViewer): Observable<ProjectFile[]> {
        return collectionViewer.viewChange.pipe(
            flatMap(listRange => {
                console.log('List range', listRange.start, listRange.end);
                return ProjectFiles.observeRootHash(this.rootHash, this.swarmService).pipe(
                    map(projectFiles => projectFiles.files)
                );
            })
        );
    }
}
