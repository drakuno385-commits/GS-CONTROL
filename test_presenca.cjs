const fs = require('fs');
const Papa = require('papaparse');

const content = fs.readFileSync('C:\\Users\\User\\Desktop\\Açoweb\\FICHA PRESENÇA.csv', 'utf8');

Papa.parse(content, {
  header: true,
  skipEmptyLines: true,
  delimiter: ';',
  complete: (results) => {
    const data = results.data;
    
    // Check 01/07/2026
    const dayData = data.filter(r => r.DATA === '01/07/2026');
    console.log("Total records for 01/07/2026:", dayData.length);
    
    const bySithoje = {};
    const uniqueWorkingRes = new Set();
    
    dayData.forEach(r => {
      const s = r.SITHOJE ? r.SITHOJE.trim().toUpperCase() : '';
      bySithoje[s || 'BLANK'] = (bySithoje[s || 'BLANK'] || 0) + 1;
      
      const isNotPresent = s.includes("FOLGA") && !s.includes("TRAB");
      const isFalta = s.includes("FALTA") || s.includes("ATESTADO") || s.includes("SUSPENS") || s.includes("DISPENSADO");
      const isPresent = !isNotPresent && !isFalta && s !== "";
      
      if (isPresent) uniqueWorkingRes.add(r.RE);
    });
    
    console.log("Status counts:", bySithoje);
    console.log("Unique working REs (Alternative Logic):", uniqueWorkingRes.size);
  }
});
