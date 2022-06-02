import { app, setState } from '../App';
import { addInfoToId, createElem } from '../Tools/general';

export class OpenFileManager {
  static async openFile() {
    if (OpenFileManager.hasNativeFS) {
      const opts = {
        types: [
          {
            description: 'Etat',
            accept: {
              'app/json': ['.' + app.environment.extension],
            },
          },
        ],
      };
      try {
        const fileHandle = await window.showOpenFilePicker(opts);
        window.dispatchEvent(
          new CustomEvent('file-opened', {
            detail: { method: 'new', file: fileHandle },
          }),
        );
      } catch (error) {
        // user closed open prompt
        console.error(error);
      }
    } else {
      window.dispatchEvent(new CustomEvent('show-file-selector'));
    }
  }

  static async newReadFile(fileHandle) {
    const file = await fileHandle.getFile();
    const content = await file.text();
    OpenFileManager.parseFile(content);
  }

  static oldReadFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => OpenFileManager.parseFile(reader.result);
    reader.readAsText(file);
  }

  static transformToNewIdSystem(objects, layer) {
    objects.shapesData.forEach(shape => {
      let oldId = shape.id;
      shape.id = addInfoToId(shape.id, layer, 'shape');
      objects.segmentsData.forEach(seg => {
        if (seg.shapeId == oldId)
          seg.shapeId = shape.id
      });
      objects.pointsData.forEach(pt => {
        if (pt.shapeId == oldId)
          pt.shapeId = shape.id
      });
      if (app.environment.name == 'Geometrie') {
        objects.shapesData.forEach(s => {
          s.geometryObject.geometryChildShapeIds.forEach((childId, idx) => {
            if (childId == oldId)
              s.geometryObject.geometryChildShapeIds[idx] = shape.id;
          });
          s.geometryObject.geometryTransformationChildShapeIds.forEach((childId, idx) => {
            if (childId == oldId)
              s.geometryObject.geometryTransformationChildShapeIds[idx] = shape.id;
          });
          if (s.geometryObject.geometryTransformationParentShapeId == oldId)
            s.geometryObject.geometryTransformationParentShapeId = shape.id;
          s.geometryObject.geometryDuplicateChildShapeIds.forEach((childId, idx) => {
            if (childId == oldId)
              s.geometryObject.geometryDuplicateChildShapeIds[idx] = shape.id;
          });
          if (s.geometryObject.geometryDuplicateParentShapeId == oldId)
            s.geometryObject.geometryDuplicateParentShapeId = shape.id;

          if (s.geometryObject.geometryParentObjectId1 == oldId)
            s.geometryObject.geometryParentObjectId1 = shape.id;
          if (s.geometryObject.geometryParentObjectId2 == oldId)
            s.geometryObject.geometryParentObjectId2 = shape.id;
          s.geometryObject.geometryTransformationCharacteristicElementIds.forEach((elemId, idx) => {
            if (elemId == oldId)
              s.geometryObject.geometryTransformationCharacteristicElementIds[idx] = shape.id;
          });
        });
      }
    });

    objects.segmentsData.forEach(segment => {
      let oldId = segment.id;
      segment.id = addInfoToId(segment.id, layer, 'segment');
      objects.shapesData.forEach(s => {
        s.segmentIds.forEach((segId, idx) => {
          if (segId == oldId)
            s.segmentIds[idx] = segment.id;
        });
      });
      objects.pointsData.forEach(pt => {
        pt.segmentIds.forEach((segId, idx) => {
          if (segId == oldId)
            pt.segmentIds[idx] = segment.id;
        });
      });
      if (app.environment.name == 'Geometrie') {
        objects.shapesData.forEach(s => {
          if (s.geometryObject.geometryParentObjectId1 == oldId)
            s.geometryObject.geometryParentObjectId1 = segment.id;
          if (s.geometryObject.geometryParentObjectId2 == oldId)
            s.geometryObject.geometryParentObjectId2 = segment.id;
          s.geometryObject.geometryTransformationCharacteristicElementIds.forEach((elemId, idx) => {
            if (elemId == oldId)
              s.geometryObject.geometryTransformationCharacteristicElementIds[idx] = segment.id;
          });
        });
      }
    });

    objects.pointsData.forEach(point => {
      let oldId = point.id;
      point.id = addInfoToId(point.id, layer, 'point');
      objects.shapesData.forEach(s => {
        s.pointIds.forEach((ptId, idx) => {
          if (ptId == oldId)
            s.pointIds[idx] = point.id;
        });
      });
      objects.segmentsData.forEach(seg => {
        seg.vertexIds.forEach((ptId, idx) => {
          if (ptId == oldId)
            seg.vertexIds[idx] = point.id;
        });
        seg.divisionPointIds.forEach((ptId, idx) => {
          if (ptId == oldId)
            seg.divisionPointIds[idx] = point.id;
        });
        if (seg.arcCenterId == oldId)
          seg.arcCenterId = point.id;
      });
      objects.pointsData.forEach(pt => {
        pt.endpointIds?.forEach((ptId, idx) => {
          if (ptId == oldId)
            pt.endpointIds[idx] = point.id;
        });
        if (pt.reference == oldId)
          pt.reference = point.id;
      });
      if (app.environment.name == 'Geometrie') {
        objects.shapesData.forEach(s => {
          if (s.geometryObject.geometryParentObjectId1 == oldId)
            s.geometryObject.geometryParentObjectId1 = point.id;
          if (s.geometryObject.geometryParentObjectId2 == oldId)
            s.geometryObject.geometryParentObjectId2 = point.id;
          s.geometryObject.geometryTransformationCharacteristicElementIds.forEach((elemId, idx) => {
            if (elemId == oldId)
              s.geometryObject.geometryTransformationCharacteristicElementIds[idx] = point.id;
          });
        });
      }
    });
  }

  static async parseFile(fileContent) {
    let saveObject;
    if (typeof fileContent == 'string') {
      try {
        saveObject = JSON.parse(fileContent);
      } catch(e) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Impossible d\'ouvrir ce fichier.' } }));
        return;
      }
    } else {
      saveObject = fileContent;
    }

    if (saveObject.appVersion == '1.0.0') {
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Impossible d\'ouvrir ce fichier. La version n\'est plus prise en charge.' } }));
      return;
    }

    if (saveObject.envName != app.environment.name) {
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Impossible d\'ouvrir ce fichier. C\'est un fichier ' + saveObject.envName + '.' } }));
      return;
    }

    OpenFileManager.transformToNewIdSystem(saveObject.wsdata.objects, 'main');

    // app.lastFileVersion = saveObject.appVersion;
    const WorkspaceManagerModule = await import('./WorkspaceManager.js');
    WorkspaceManagerModule.WorkspaceManager.setWorkspaceFromObject(saveObject.wsdata);
    if (app.environment.name == 'Tangram')
      app.mainCanvasLayer.removeAllObjects();

    if (saveObject.settings) {
      setState({ settings: { ...saveObject.settings } });
    } else {
      app.resetSettings();
    }

    if (saveObject.fullHistory) {
      setState({ fullHistory: { ...saveObject.fullHistory } });
    } else {
      setState({
        fullHistory: { ...app.defaultState.fullHistory },
      });
    }

    if (saveObject.history) {
      setState({ history: { ...saveObject.history } });
    } else {
      setState({
        history: {
          ...app.defaultState.history,
          startSituation: {
            ...app.workspace.data,
            tangram: {
              isSilhouetteShown: true,
              currentStep: 'start',
              buttonText: 'Vérifier solution',
              buttonValue: 'check',
            }
          },
          startSettings: { ...app.settings },
        },
      });
    }

    if (saveObject.toolsVisible) {
      saveObject.toolsVisible.forEach(toolVisible => app.tools.find(tool => tool.name == toolVisible.name).isVisible = toolVisible.isVisible)
      saveObject.familiesVisible.forEach(familyVisible => app.environment.families.find(family => family.name == familyVisible.name).isVisible = familyVisible.isVisible)
      setState({ tools: [...app.tools] });
    }

    window.dispatchEvent(
      new CustomEvent('file-parsed', { detail: saveObject }),
    );
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }
}

window.addEventListener('open-file', async () => {
  await import('../../popups/open-popup');
  createElem('open-popup');
});

window.addEventListener('local-open-file', () => {
  OpenFileManager.openFile();
});

window.addEventListener('file-opened', (event) => {
  if (event.detail.method == 'old')
    OpenFileManager.oldReadFile(event.detail.file);
  else OpenFileManager.newReadFile(event.detail.file[0]);
});

window.addEventListener('parse-file', (event) => {
  OpenFileManager.parseFile(event.detail.fileContent);
});

// Si ancien ou nouveau systeme de fichier
OpenFileManager.hasNativeFS = 'showOpenFilePicker' in window;
