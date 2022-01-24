import { uniqId } from '../../Tools/general';
// import { NewShape } from './NewShape';
import { RegularShape } from './RegularShape';

export class GeometryObject {

  constructor({
    geometryChildShapeIds = [],
    geometryConstructionSpec = {},
    geometryParentObjectId1 = null,
    geometryParentObjectId2 = null,
    geometryTransformationChildShapeIds = [],
    geometryTransformationParentShapeId = null,
    geometryTransformationCharacteristicElementIds = [],
    geometryTransformationName = null,
    geometryIsVisible = true,
  }) {
    this.geometryChildShapeIds = [...geometryChildShapeIds];
    this.geometryConstructionSpec = geometryConstructionSpec;
    this.geometryParentObjectId1 = geometryParentObjectId1;
    this.geometryParentObjectId2 = geometryParentObjectId2;
    this.geometryTransformationChildShapeIds = [...geometryTransformationChildShapeIds];
    this.geometryTransformationParentShapeId = geometryTransformationParentShapeId;
    this.geometryTransformationCharacteristicElementIds = [...geometryTransformationCharacteristicElementIds];
    this.geometryTransformationName = geometryTransformationName;
    this.geometryIsVisible = geometryIsVisible;
  }

  saveData() {
    let data = {
      geometryChildShapeIds: [...this.geometryChildShapeIds],
      geometryConstructionSpec: this.geometryConstructionSpec,
      geometryParentObjectId1: this.geometryParentObjectId1,
      geometryParentObjectId2: this.geometryParentObjectId2,
      geometryTransformationChildShapeIds: [...this.geometryTransformationChildShapeIds],
      geometryTransformationParentShapeId: this.geometryTransformationParentShapeId,
      geometryTransformationCharacteristicElementIds: [...this.geometryTransformationCharacteristicElementIds],
      geometryTransformationName: this.geometryTransformationName,
      geometryIsVisible: this.geometryIsVisible,
    };
    return data;
  }

  static loadFromData(data) {
    let object = new GeometryObject({
    });
    Object.assign(shape, data);
    shape.segmentIds = [...data.segmentIds];
    shape.pointIds = [...data.pointIds];
  }
}
