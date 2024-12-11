
export function preventBacktrack(path: string) {
  const pathArr = path.split(/\/|\\/);
  const newPathArr = pathArr.filter((item) => item !== "..");

  return newPathArr.join("/");
}