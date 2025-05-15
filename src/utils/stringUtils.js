export const toTitleCase = (str) => {
  if (!str) return "";

  const exceptions = ["AM", "PM", "RV"];
  return str
    .split(" ")
    .map((word) => {
      if (exceptions.includes(word)) {
        return word;
      }
      if (word.includes("/")) {
        return word
          .split("/")
          .map(
            (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          )
          .join("/");
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};
