import { CharacteristicElements } from '../CharacteristicElements';

export class GeometryObject {
  constructor({
    geometryChildShapeIds = [],
    geometryConstructionSpec = {},
    geometryParentObjectId1 = null,
    geometryParentObjectId2 = null,
    geometryTransformationChildShapeIds = [],
    geometryTransformationParentShapeId = null,
    geometryTransformationCharacteristicElements = null,
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
    geometryIsCharacteristicElements = false,
  }) {
    this.geometryChildShapeIds = [...geometryChildShapeIds];
    this.geometryConstructionSpec = { ...geometryConstructionSpec };
    this.geometryParentObjectId1 = geometryParentObjectId1;
    this.geometryParentObjectId2 = geometryParentObjectId2;
    this.geometryTransformationChildShapeIds = [
      ...geometryTransformationChildShapeIds,
    ];
    this.geometryTransformationParentShapeId =
      geometryTransformationParentShapeId;
    if (geometryTransformationCharacteristicElements)
      this.geometryTransformationCharacteristicElements =
        new CharacteristicElements(
          geometryTransformationCharacteristicElements,
        );
    this.geometryTransformationName = geometryTransformationName;
    this.geometryDuplicateChildShapeIds = [...geometryDuplicateChildShapeIds];
    this.geometryDuplicateParentShapeId = geometryDuplicateParentShapeId;
    this.geometryDuplicateInfos = { ...geometryDuplicateInfos };
    this.geometryIsVisible = geometryIsVisible;
    this.geometryIsHidden = geometryIsHidden;
    this.geometryIsPermanentHidden = geometryIsPermanentHidden;
    this.geometryIsVisibleByChoice = geometryIsVisibleByChoice;
    this.geometryIsConstaintDraw = geometryIsConstaintDraw;
    this.geometryPointOnTheFlyChildId = geometryPointOnTheFlyChildId;
    this.geometryMultipliedParentShapeId = geometryMultipliedParentShapeId;
    this.geometryMultipliedChildShapeIds = geometryMultipliedChildShapeIds;
    this.geometryIsCharacteristicElements = geometryIsCharacteristicElements;
  }

  saveData() {
    const data = {};
    if (this.geometryChildShapeIds.length !== 0)
      data.geometryChildShapeIds = [...this.geometryChildShapeIds];
    if (Object.keys(this.geometryConstructionSpec).length !== 0)
      data.geometryConstructionSpec = { ...this.geometryConstructionSpec };
    if (this.geometryParentObjectId1 !== null)
      data.geometryParentObjectId1 = this.geometryParentObjectId1;
    if (this.geometryParentObjectId2 !== null)
      data.geometryParentObjectId2 = this.geometryParentObjectId2;
    if (this.geometryTransformationChildShapeIds.length !== 0)
      data.geometryTransformationChildShapeIds = [
        ...this.geometryTransformationChildShapeIds,
      ];
    if (this.geometryTransformationParentShapeId !== null)
      data.geometryTransformationParentShapeId =
        this.geometryTransformationParentShapeId;
    if (this.geometryTransformationCharacteristicElements !== null)
      data.geometryTransformationCharacteristicElements = {
        ...this.geometryTransformationCharacteristicElements,
      };
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
      data.geometryDuplicateChildShapeIds = [
        ...this.geometryDuplicateChildShapeIds,
      ];
    if (this.geometryDuplicateParentShapeId !== null)
      data.geometryDuplicateParentShapeId = this.geometryDuplicateParentShapeId;
    if (
      this.geometryDuplicateInfos.rotationAngle !== null &&
      this.geometryDuplicateInfos.parentFirstPointCoordinates !== null
    )
      data.geometryDuplicateInfos = { ...this.geometryDuplicateInfos };
    if (this.geometryIsConstaintDraw !== false)
      data.geometryIsConstaintDraw = this.geometryIsConstaintDraw;
    if (this.geometryPointOnTheFlyChildId !== null)
      data.geometryPointOnTheFlyChildId = this.geometryPointOnTheFlyChildId;
    if (this.geometryMultipliedParentShapeId !== null)
      data.geometryMultipliedParentShapeId =
        this.geometryMultipliedParentShapeId;
    if (this.geometryMultipliedChildShapeIds.length !== 0)
      data.geometryMultipliedChildShapeIds = [
        ...this.geometryMultipliedChildShapeIds,
      ];
    if (this.geometryIsCharacteristicElements)
      data.geometryIsCharacteristicElements =
        this.geometryIsCharacteristicElements;
    return data;
  }

  static loadFromData(data) {
    return new GeometryObject(data);
  }
}
