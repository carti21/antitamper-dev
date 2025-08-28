/**
 * Formats a datetime string into a readable format
 * @param datetime ISO format timestamp (e.g., "2025-03-12T03:16:55.000Z")
 * @returns Formatted date and time string (e.g., "12/03/2025 03:16:55 AM")
 */
export const formatDateTime = (datetime: string): string => {
  if (!datetime) return "N/A";

  try {
    // Check for default date (01/01/2004)
    if (datetime.includes('01/01/2004') || 
        (datetime.includes('2004-01-01') && datetime.includes('03:00:1'))) {
      return "Not Available";
    }

    // Handle ISO format timestamps (e.g., "2025-03-12T03:16:55.000Z")
    if (datetime.includes('T') && (datetime.includes('Z') || datetime.includes('+'))) {
      const date = new Date(datetime);
      if (isNaN(date.getTime())) {
        return "Invalid Format";
      }
      
      if (date.getFullYear() === 2004 && date.getMonth() === 0 && date.getDate() === 1) {
        return "Not Available";
      }
      
      // Format date as DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      
      // Format time as HH:MM:SS AM/PM
      const hours = date.getHours();
      const formattedHours = ((hours % 12) || 12).toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedTime = `${formattedHours}:${minutes}:${seconds}`;
      
      return `${formattedDate} ${formattedTime} ${period}`;
    }
    
    // Handle string format "01/01/2004 03:00:14 AM"
    if (typeof datetime === 'string' && datetime.includes('01/01/2004')) {
      return "Not Available";
    }

    // Handle other datetime formats
    return datetime;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Format Error";
  }
};
