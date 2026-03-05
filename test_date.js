const d = new Date().toLocaleString();
console.log("Locale String:", d);
const parsed = new Date(d);
console.log("Parsed Date:", parsed);
console.log("Is Valid:", !isNaN(parsed.getTime()));
console.log("To Date String:", parsed.toDateString());
console.log("Now Date String:", new Date().toDateString());
console.log("Equal:", parsed.toDateString() === new Date().toDateString());
