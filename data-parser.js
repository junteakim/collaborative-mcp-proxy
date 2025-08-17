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
    
    // Extract temperature (°C, °F, K)
    const tempMatch = text.match(/(\d+\.?\d*)\s*°?(c|f|k|celsius|fahrenheit|kelvin)/i);
    if (tempMatch) {
      let temp = parseFloat(tempMatch[1]);
      const unit = tempMatch[2].toLowerCase();
      
      // Convert to Celsius
      if (unit === 'f' || unit === 'fahrenheit') temp = (temp - 32) * 5/9;
      if (unit === 'k' || unit === 'kelvin') temp = temp - 273.15;
      
      data.temperature = temp;
    }
    
    // Extract diameter/ID (mm, m, inches)
    const diameterMatch = text.match(/(diameter|id|inner\s*diameter)[\s:]*(\d+\.?\d*)\s*(mm|m|inch|inches|")/i);
    if (diameterMatch) {
      let diameter = parseFloat(diameterMatch[2]);
      const unit = diameterMatch[3].toLowerCase();
      
      // Convert to mm
      if (unit === 'm') diameter = diameter * 1000;
      if (unit === 'inch' || unit === 'inches' || unit === '"') diameter = diameter * 25.4;
      
      data.diameter = diameter;
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