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
    geometryIsPermanentHidden = false,
    geometryIsVisibleByChoice = true,
    geometryIsConstaintDraw = false,
    geometryPointOnTheFlyChildId = null,
    geometryMultipliedParentShapeId = null,
    geometryMultipliedChildShapeIds = [],
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
    this.geometryIsPermanentHidden = geometryIsPermanentHidden;
    this.geometryIsVisibleByChoice = geometryIsVisibleByChoice;
    this.geometryIsConstaintDraw = geometryIsConstaintDraw;
    this.geometryPointOnTheFlyChildId = geometryPointOnTheFlyChildId;
    this.geometryMultipliedParentShapeId = geometryMultipliedParentShapeId;
    this.geometryMultipliedChildShapeIds = geometryMultipliedChildShapeIds;
  }

  saveData() {
    let data = {
      // geometryChildShapeIds: [...this.geometryChildShapeIds],
      // geometryConstructionSpec: {...this.geometryConstructionSpec},
      // geometryParentObjectId1: this.geometryParentObjectId1,
      // geometryParentObjectId2: this.geometryParentObjectId2,
      // geometryTransformationChildShapeIds: [...this.geometryTransformationChildShapeIds],
      // geometryTransformationParentShapeId: this.geometryTransformationParentShapeId,
      // geometryTransformationCharacteristicElementIds: [...this.geometryTransformationCharacteristicElementIds],
      // geometryTransformationName: this.geometryTransformationName,
      // geometryIsVisible: this.geometryIsVisible,
      // geometryIsHidden: this.geometryIsHidden,
      // geometryIsVisibleByChoice: this.geometryIsVisibleByChoice,
      // geometryDuplicateChildShapeIds: [...this.geometryDuplicateChildShapeIds],
      // geometryDuplicateParentShapeId: this.geometryDuplicateParentShapeId,
      // geometryDuplicateInfos: {...this.geometryDuplicateInfos},
      // geometryIsConstaintDraw: this.geometryIsConstaintDraw,
      // geometryPointOnTheFlyChildId: this.geometryPointOnTheFlyChildId,
    };
    if (this.geometryChildShapeIds.length !== 0)
      data.geometryChildShapeIds = [...this.geometryChildShapeIds];
    if (Object.keys(this.geometryConstructionSpec).length !== 0)
      data.geometryConstructionSpec = {...this.geometryConstructionSpec};
    if (this.geometryParentObjectId1 !== null)
      data.geometryParentObjectId1 = this.geometryParentObjectId1;
    if (this.geometryParentObjectId2 !== null)
      data.geometryParentObjectId2 = this.geometryParentObjectId2;
    if (this.geometryTransformationChildShapeIds.length !== 0)
      data.geometryTransformationChildShapeIds = [...this.geometryTransformationChildShapeIds];
    if (this.geometryTransformationParentShapeId !== null)
      data.geometryTransformationParentShapeId = this.geometryTransformationParentShapeId;
    if (this.geometryTransformationCharacteristicElementIds.length !== 0)
      data.geometryTransformationCharacteristicElementIds = [...this.geometryTransformationCharacteristicElementIds];
    if (this.geometryTransformationName !== null)
      data.geometryTransformationName = this.geometryTransformationName;
    if (this.geometryIsVisible !== true)
      data.geometryIsVisible = this.geometryIsVisible;
    if (this.geometryIsHidden !== false)
      data.geometryIsHidden = this.geometryIsHidden;
      if (this.geometryIsPermanentHidden !== false)
        data.geometryIsPermanentHidden = this.geometryIsPermanentHidden;
    if (this.geometryIsVisibleByChoice !== true)
      data.geometryIsVisibleByChoice = this.geometryIsVisibleByChoice;
    if (this.geometryDuplicateChildShapeIds.length !== 0)
      data.geometryDuplicateChildShapeIds = [...this.geometryDuplicateChildShapeIds];
    if (this.geometryDuplicateParentShapeId !== null)
      data.geometryDuplicateParentShapeId = this.geometryDuplicateParentShapeId;
    if (this.geometryDuplicateInfos.rotationAngle !== null && this.geometryDuplicateInfos.parentFirstPointCoordinates !== null)
      data.geometryDuplicateInfos = {...this.geometryDuplicateInfos};
    if (this.geometryIsConstaintDraw !== false)
      data.geometryIsConstaintDraw = this.geometryIsConstaintDraw;
    if (this.geometryPointOnTheFlyChildId !== null)
      data.geometryPointOnTheFlyChildId = this.geometryPointOnTheFlyChildId;
    if (this.geometryMultipliedParentShapeId !== null)
      data.geometryMultipliedParentShapeId = this.geometryMultipliedParentShapeId;
    if (this.geometryMultipliedChildShapeIds.length !== 0)
      data.geometryMultipliedChildShapeIds = [...this.geometryMultipliedChildShapeIds];
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
