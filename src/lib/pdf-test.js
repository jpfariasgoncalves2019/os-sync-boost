const { jsPDF } = require("jspdf");
require("jspdf-autotable");

const doc = new jsPDF();

doc.autoTable({
  head: [["Column 1", "Column 2", "Column 3"]],
  body: [
    ["Data 1", "Data 2", "Data 3"],
    ["Data 4", "Data 5", "Data 6"],
  ],
});

doc.save("test.pdf");
