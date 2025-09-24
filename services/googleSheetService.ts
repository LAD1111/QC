import { AdData } from '../types';

const SHEET_ID = '1myNDRmrQg4IK2eSJ7cjAgRX7s-DYZgvH_7kE4E5jPkc';
const GID = '0';
// Using the /export endpoint which tends to have better CORS support for client-side fetching.
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

/**
 * Parses a numeric string from the CSV which may contain dots as thousand separators.
 * e.g., "1.500.000" -> 1500000
 */
const parseVietnameseNumber = (numStr: string): number => {
  if (!numStr) return 0;
  return parseFloat(numStr.replace(/\./g, '').replace(/,/, '.')) || 0;
};

/**
 * Parses a date string from D/M/YYYY to YYYY-MM-DD for correct sorting.
 */
const parseDate = (dateStr: string): string => {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    // Pad with zero if needed and return as YYYY-MM-DD
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr; // Fallback for unexpected formats
};


const parseCSV = (csvText: string): AdData[] => {
  try {
    const lines = csvText.trim().split('\n');
    const header = lines.shift();
    if (!header) return [];

    return lines.map((line, index) => {
      // Simple regex to split CSV row, handles quoted values
      const values = (line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [])
        .map(v => v.trim().replace(/^"|"$/g, '')); // remove quotes

      // Assuming new columns SL đơn and Chi phí vận hành are added at the end
      if (values.length < 8) {
        console.warn(`Skipping malformed line ${index + 2}: ${line}`);
        return null;
      }

      const adCost = parseVietnameseNumber(values[2]);
      const revenue = parseVietnameseNumber(values[3]);
      // Assuming SL đơn is at index 6 and Chi phí vận hành is at index 7
      const orders = parseVietnameseNumber(values[6]); 
      const operatingCost = parseVietnameseNumber(values[7]);

      const profit = revenue - adCost - operatingCost;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const adCostPerOrder = orders > 0 ? adCost / orders : 0;
      const profitPerOrder = orders > 0 ? profit / orders : 0;


      return {
        date: parseDate(values[0]),
        product: values[1],
        adCost,
        revenue,
        orders,
        operatingCost,
        profit,
        profitMargin,
        adCostPerOrder,
        profitPerOrder,
      };
    }).filter((item): item is AdData => item !== null);
  } catch (error) {
    console.error("Failed to parse CSV:", error);
    return [];
  }
};


export const fetchAndParseData = async (): Promise<AdData[]> => {
  try {
    const response = await fetch(GOOGLE_SHEET_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error)
 {
    console.error("Error fetching or parsing sheet data:", error);
    throw error;
  }
};