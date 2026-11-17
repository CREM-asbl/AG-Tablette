# Small script used to modify entries in tangramShapeKit for the save version 1.0.8
# It only prints the result, it does not modify the file.

import re

ids = ["176e14f3b4d290d6", "176e14f3b4da6d79", "176e14f3b4d993e0", "176e14f3b4de90f", "176e14f3b4d24e33", "176e14f3b4de92f0", "176e14f3b4dd816", "176e14f3b4d27cb0", "176e14f3b4d70318", "176e14f3b4d82083", "176e14f3b4da5f53", "176e14f3b4de137a", "176e14f3b4daa5e", "176e14f3b4d628bd", "176e14f3b4d97439", "176e14f3b4d76905", "176e14f3b4db622e", "176e14f3b4d5c15e", "176e14f3b4db68eb", "176e14f3b4dd17aa", "176e14f3b4de5b6b", "176e14f3b4dbd00c", "176e14f3b4d1681a", "176e14f3b4d4825d", "176e14f3b4d1cfee", "176e14f3b4d138f1", "176e14f3b4d5a2fa", "176e14f3b4d6c323", "176e14f3b4d38e17", "176e14f3b4d911d5", "176e14f3b4dac447", "176e14f3b4dac001", "176e14f3b4d18e72", "176e14f3b4d67ebe", "176e14f3b4d10610", "176e14f3b4d61e01", "176e14f3b4d1cea3", "176e14f3b4d57264", "176e14f3b4d4e8fd", "176e14f3b4dc1e09", "176e14f3b4dda073", "176e14f3b4d9404f", "176e14f3b4db51ce", "176e14f3b4de9e6e", "176e14f3b4d90e27", "176e14f3b4d5f4a6", "176e14f3b4d7eb49", "176e14f3b4d616c5", "176e14f3b4db94c4", "176e14f3b4d81346", "176e14f3b4d71f89", "176e14f3b4ddc3c1", "176e14f3b4d3d2de", "176e14f3b4d2f931", "176e14f3b4dd3bd3", "176e14f3b4d8f584", "176e14f3b4deecd", "176e14f3b4d420b8", "176e14f3b4d5d399", "176e14f3b4d2b7de", "176e14f3b4dc32fd", "176e14f3b4d29972", "176e14f3b4d404ea", "176e14f3b4dab21a", "176e14f3b4da950e", "176e14f3b4d60153", "176e14f3b4d355b8", "176e14f3b4dd905c", "176e14f3b4d8e51a", "176e14f3b4d50861", "176e14f3b4dbd407", "176e14f3b4db582a", "176e14f3b4d4a2e8", "176e14f3b4dbe56a", "176e14f3b4d34723", "176e14f3b4d25313", "176e14f3b4d4f40d", "176e14f3b4d2e5dc", "176e14f3b4d916df", "176e14f3b4dd40ee", "176e14f3b4dcca00", "176e14f3b4d193cc", "176e14f3b4d4e454", "176e14f3b4d779cd", "176e14f3b4d438f7", "176e14f3b4d341ab", "176e14f3b4d3f2ad", "176e14f3b4d10751", "176e14f3b4dd3e05", "176e14f3b4d74dba", "176e14f3b4d714c9", "176e14f3b4d97f90", "176e14f3b4dd4159", "176e14f3b4d319b5"]

file = open("oldTangramData.json", "r")
content = file.read()
matches = re.findall(r"\{.*?\"id\": \"([^\"]*)\".*?\"path\": \"([^\"]*)\".*?\}", content, flags=re.S)
for match in matches:
  shapeId = "\"" + match[0] + "\""
  pointsMatches = re.findall(r"([ML] -?[0-9]+\.?[0-9]* -?[0-9]+\.?[0-9]*|[HV] -?[0-9]+\.?[0-9]*)", match[1])
  print(pointsMatches)
  numberOfPoints = len(pointsMatches)
  pointIds = []
  for i in range(numberOfPoints):
    pointIds.append("\"" + ids.pop() + "\"")
  segmentIds = []
  for i in range(numberOfPoints):
    segmentIds.append("\"" + ids.pop() + "\"")
  currentPointx = "0"
  currentPointy = "0"
  idx = 0
  print('---- shape ----')

  print(
r""""segmentIds": ["""+", ".join(segmentIds)+r"""],
        "pointIds": ["""+", ".join(pointIds)+r"""],
"""
  )

  print('---- points ----')
  for point in pointsMatches:
    split = point.split()
    if split[0] == 'M' or split[0] == 'L':
      currentPointx = split[1]
      currentPointy = split[2]
    elif split[0] == 'V':
      currentPointy = split[1]
    elif split[0] == 'H':
      currentPointx = split[1]

    nextIdx = (idx - 1 + numberOfPoints) % numberOfPoints

    print(
r"""{
  "id": """+pointIds[idx]+r""",
  "coordinates":{"x": """+currentPointx+r""","y": """+currentPointy+r"""},
  "shapeId":"""+shapeId+r""",
  "idx":"""+str(idx)+r""",
  "segmentIds":["""+segmentIds[idx]+r""","""+segmentIds[nextIdx]+r"""],
  "type":"vertex",
  "visible":true,
  "color":"#000",
  "size":1
},"""
    )

    idx += 1

  print('---- segments ----')
  for idx in range(numberOfPoints):

    nextIdx = (idx + 1) % numberOfPoints

    print(
r"""{
  "id": """+segmentIds[idx]+r""",
  "shapeId":"""+shapeId+r""",
  "idx":"""+str(idx)+r""",
  "vertexIds":["""+pointIds[idx]+r""","""+pointIds[nextIdx]+r"""],
  "divisionPointIds":[],
  "counterclockwise":false,
  "isInfinite":false,
  "isSemiInfinite":false
},"""
    )
