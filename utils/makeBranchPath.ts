export default (branchName: string, path: string) =>
  branchName.split("/").concat(path ? path.split("/") : []);
