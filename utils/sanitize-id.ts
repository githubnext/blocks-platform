export default (id: string) => {
  return id.replace(/[^a-zA-Z0-9_\.-]/g, "-");
};
