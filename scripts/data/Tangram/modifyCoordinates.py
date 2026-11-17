# Small script used to modify entries in tangramShapeKit easily with xOffset, yOffset and then apply a scale.
# It only prints the result, it does not modify the file.

import re

xOffset = -26
yOffset = -26
scale = 1 / 0.42

def replaceML(match):
  return " ".join(( match.group(1), str( (float(match.group(2))/ scale - xOffset) ), str( (float(match.group(3))/ scale - yOffset) ) ))

def replaceA(match):
  return " ".join(( match.group(1), str( (float(match.group(2))/ scale )), str( (float(match.group(3))/ scale )), match.group(4), match.group(5), match.group(6), str( (float(match.group(7))/ scale - xOffset) ), str( (float(match.group(8))/ scale - yOffset) ) ))

def replaceH(match):
  return " ".join((match.group(1), str((float(match.group(2))/ scale - xOffset))))

def replaceV(match):
  return " ".join((match.group(1),  str((float(match.group(2))/ scale - yOffset))))

f = open("template.svg", "r")
d = f.read()
d = re.sub(r"([\" \n][ML]) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*)", replaceML, d)
d = re.sub(r"([\" \n][A]) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*) (-?[0-9]+\.?[0-9]*)", replaceA, d)
d = re.sub(r"([\" \n][H]) (-?[0-9]+\.?[0-9]*)", replaceH, d)
d = re.sub(r"([\" \n][V]) (-?[0-9]+\.?[0-9]*)", replaceV, d)
print(d)