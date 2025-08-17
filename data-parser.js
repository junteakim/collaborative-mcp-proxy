/**
 * Dynamic data parser for pressure vessel analysis
 * Extracts real parameters from user input
 */

class DataParser {
  constructor() {
    this.defaultValues = {
      pressure: 15, // bar
      temperature: 80, // °C
      diameter: 1200, // mm
      material: 'ASTM A516 Grade 70'
    };
  }

  parseVesselData(text) {
    const data = { ...this.defaultValues };
    
    if (!text) return data;
    
    const textLower = text.toLowerCase();
    
    // Extract pressure (bar, psi, mpa) - fixed decimal number regex
    const pressureMatches = text.match(/(\d+\.?\d*)\s*(bar|psi|mpa|kpa)/gi);
    if (pressureMatches && pressureMatches.length > 0) {
      // Find the highest pressure value (most likely the design pressure)
      let maxPressure = 0;
      let maxUnit = 'bar';
      
      for (const match of pressureMatches) {
        const numbers = match.match(/(\d+\.?\d*)/);
        const units = match.match(/(bar|psi|mpa|kpa)/i);
        
        if (numbers && units) {
          let pressure = parseFloat(numbers[1]);
          const unit = units[1].toLowerCase();
          
          // Convert to bar for comparison
          let pressureInBar = pressure;
          if (unit === 'psi') pressureInBar = pressure * 0.0689476;
          if (unit === 'mpa') pressureInBar = pressure * 10;
          if (unit === 'kpa') pressureInBar = pressure * 0.01;
          
          // Take the highest pressure value
          if (pressureInBar > maxPressure) {
            maxPressure = pressureInBar;
            maxUnit = unit;
          }
        }
      }
      
      if (maxPressure > 0) {
        data.pressure = maxPressure;
      }
    }
    
    // Extract temperature (°C, °F, K) - improved to find highest value
    const tempMatches = text.match(/(\d+\.?\d*)\s*°?(c|f|k|celsius|fahrenheit|kelvin)/gi);
    if (tempMatches && tempMatches.length > 0) {
      let maxTemp = -999;
      
      for (const match of tempMatches) {
        const numbers = match.match(/(\d+\.?\d*)/);
        const units = match.match(/(c|f|k|celsius|fahrenheit|kelvin)/i);
        
        if (numbers && units) {
          let temp = parseFloat(numbers[1]);
          const unit = units[1].toLowerCase();
          
          // Convert to Celsius for comparison
          let tempInC = temp;
          if (unit === 'f' || unit === 'fahrenheit') tempInC = (temp - 32) * 5/9;
          if (unit === 'k' || unit === 'kelvin') tempInC = temp - 273.15;
          
          // Take the highest reasonable temperature (likely the design temp)
          if (tempInC > maxTemp && tempInC < 1000) { // reasonable upper limit
            maxTemp = tempInC;
          }
        }
      }
      
      if (maxTemp > -999) {
        data.temperature = maxTemp;
      }
    }
    
    // Extract diameter/ID (mm, m, inches) - improved regex
    const diameterMatches = text.match(/(\d+\.?\d*)\s*(millimeters?|mm|meters?|m|inches?|inch|")/gi);
    if (diameterMatches && diameterMatches.length > 0) {
      let maxDiameter = 0;
      
      for (const match of diameterMatches) {
        const numbers = match.match(/(\d+\.?\d*)/);
        const units = match.match(/(millimeters?|mm|meters?|m|inches?|inch|")/i);
        
        if (numbers && units) {
          let diameter = parseFloat(numbers[1]);
          const unit = units[1].toLowerCase();
          
          // Convert to mm
          let diameterInMm = diameter;
          if (unit.includes('meter') || unit === 'm') diameterInMm = diameter * 1000;
          if (unit.includes('inch') || unit === '"') diameterInMm = diameter * 25.4;
          
          // Take the largest diameter (likely the vessel diameter)
          if (diameterInMm > maxDiameter && diameterInMm < 50000) { // reasonable upper limit
            maxDiameter = diameterInMm;
          }
        }
      }
      
      if (maxDiameter > 0) {
        data.diameter = maxDiameter;
      }
    }
    
    // Extract material
    const materialMatch = text.match(/(astm\s*a\s*\d+|sa[\s-]\d+|material[\s:]*[a-z0-9\s-]+)/i);
    if (materialMatch) {
      data.material = materialMatch[0].trim();
    }
    
    return data;
  }

  formatAnalysis(task, data) {
    return {
      task: task,
      extractedData: data,
      isRealData: this.hasRealData(data),
      summary: `Pressure: ${data.pressure} bar, Temperature: ${data.temperature}°C, Diameter: ${data.diameter}mm, Material: ${data.material}`
    };
  }

  hasRealData(data) {
    // Check if any values differ from defaults
    return data.pressure !== this.defaultValues.pressure ||
           data.temperature !== this.defaultValues.temperature ||
           data.diameter !== this.defaultValues.diameter ||
           data.material !== this.defaultValues.material;
  }
}

export default DataParser;