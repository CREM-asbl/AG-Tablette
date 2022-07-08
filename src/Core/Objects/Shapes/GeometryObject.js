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
    geometryDuplicateChildShapeIds = [],
    geometryDuplicateParentShapeId = null,
    geometryDuplicateInfos = {
      rotationAngle: null,
      parentFirstPointCoordinates: null,
    },
    geometryIsVisible = true,
    geometryIsHidden = false,
    geometryIsVisibleByChoice = true,
    geometryIsConstaintDraw = false,
  }) {
    this.geometryChildShapeIds = [...geometryChildShapeIds];
    this.geometryConstructionSpec = {...geometryConstructionSpec};
    this.geometryParentObjectId1 = geometryParentObjectId1;
    this.geometryParentObjectId2 = geometryParentObjectId2;
    this.geometryTransformationChildShapeIds = [...geometryTransformationChildShapeIds];
    this.geometryTransformationParentShapeId = geometryTransformationParentShapeId;
    this.geometryTransformationCharacteristicElementIds = [...geometryTransformationCharacteristicElementIds];
    this.geometryTransformationName = geometryTransformationName;
    this.geometryDuplicateChildShapeIds = [...geometryDuplicateChildShapeIds];
    this.geometryDuplicateParentShapeId = geometryDuplicateParentShapeId;
    this.geometryDuplicateInfos = {...geometryDuplicateInfos};
    this.geometryIsVisible = geometryIsVisible;
    this.geometryIsHidden = geometryIsHidden;
    this.geometryIsVisibleByChoice = geometryIsVisibleByChoice;
    this.geometryIsConstaintDraw = geometryIsConstaintDraw;
  }

  saveData() {
    let data = {
      geometryChildShapeIds: [...this.geometryChildShapeIds],
      geometryConstructionSpec: {...this.geometryConstructionSpec},
      geometryParentObjectId1: this.geometryParentObjectId1,
      geometryParentObjectId2: this.geometryParentObjectId2,
      geometryTransformationChildShapeIds: [...this.geometryTransformationChildShapeIds],
      geometryTransformationParentShapeId: this.geometryTransformationParentShapeId,
      geometryTransformationCharacteristicElementIds: [...this.geometryTransformationCharacteristicElementIds],
      geometryTransformationName: this.geometryTransformationName,
      geometryIsVisible: this.geometryIsVisible,
      geometryIsHidden: this.geometryIsHidden,
      geometryIsVisibleByChoice: this.geometryIsVisibleByChoice,
      geometryDuplicateChildShapeIds: [...this.geometryDuplicateChildShapeIds],
      geometryDuplicateParentShapeId: this.geometryDuplicateParentShapeId,
      geometryDuplicateInfos: {...this.geometryDuplicateInfos},
      geometryIsConstaintDraw: this.geometryIsConstaintDraw,
    };
    return data;
  }

  static loadFromData(data) {
    let object = new GeometryObject(data);
    // Object.assign(object, data);
    // object.geometryChildShapeIds = [...data.geometryChildShapeIds];
    // object.geometryConstructionSpec = {...data.geometryConstructionSpec};
    // object.geometryTransformationChildShapeIds = [...data.geometryTransformationChildShapeIds];
    // object.geometryTransformationCharacteristicElementIds = [...data.geometryTransformationCharacteristicElementIds];
    return object;
  }
}
