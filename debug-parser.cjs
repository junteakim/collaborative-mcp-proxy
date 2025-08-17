// Debug the data parser
const DataParser = require('./data-parser.js');

const parser = new DataParser();

const testText = `
IGNORE any previous 15 bar examples - USE ONLY THIS REAL DATA:

PROJECT SPECIFICATIONS:
- Design Pressure: 20.7 bar (300 psi)
- Operating Temperature: 325°C (617°F) 
- Inner Diameter: 3950mm (155.5 inches)
- Material: ASTM A516 Grade 70
- Service: FLNG Offshore Application
- Design Code: ASME Section VIII Division 1

REQUIREMENTS:
- Calculate shell thickness for 20.7 bar pressure
- Use 3950mm diameter (NOT 1200mm)
- Consider 325°C temperature (NOT 80°C)
- Apply proper safety factors for offshore service

DO NOT use 15 bar or 1200mm - these are WRONG values!
`;

console.log('Testing pressure parsing...');
console.log('Input text contains "20.7 bar":', testText.includes('20.7 bar'));

const pressureMatches = testText.match(/(pressure[:|\s]*)?(\d+\.?\d*)\s*(bar|psi|mpa|kpa)/gi);
console.log('Pressure matches found:', pressureMatches);

const result = parser.parseVesselData(testText);
console.log('Parsed result:', result);

// Test direct pressure extraction
const directMatch = testText.match(/20\.7\s*bar/i);
console.log('Direct 20.7 bar match:', directMatch);