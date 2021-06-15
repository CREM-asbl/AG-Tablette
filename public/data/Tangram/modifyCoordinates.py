# Small script used to modify entries in tangramShapeKit easily with xOffset, yOffset and then apply a scale.
# It only prints the result, it does not modify the file.

import re

xOffset = -56.325569909594186
yOffset = -62.67211299799919
scale = 1/0.8677803523248963

def replaceML(match):
  return " ".join(( match.group(1), str( (float(match.group(2)) - xOffset) / scale ), str( (float(match.group(3)) - yOffset) / scale ) ))

def replaceH(match):
  return " ".join((match.group(1), str((float(match.group(2)) - xOffset) / scale)))

def replaceV(match):
  return " ".join((match.group(1),  str((float(match.group(2)) - yOffset) / scale)))

f = open("tangramShapeKit.json", "r")
d = f.read()
d = re.sub(r"([\" \n][ML]) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*)", replaceML, d)
d = re.sub(r"([\" \n][H]) (-?[0-9]+\.?[0-9]*)", replaceH, d)
d = re.sub(r"([\" \n][V]) (-?[0-9]+\.?[0-9]*)", replaceV, d)
print(d)