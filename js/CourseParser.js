// CourseParser.js - Handles parsing of course catalogs
class CourseParser {
  static parseTime(timeStr) {
    // Handle formats like "MW9.30-11", "TR3-4.30", "F9-11", "MWF1"
    const dayPattern = /^[MTWRF]+/;
    const timePattern = /(\d{1,2})(?:\.(\d{2}))?(?:-(\d{1,2})(?:\.(\d{2}))?)?/;
    
    const dayMatch = timeStr.match(dayPattern);
    const timeMatch = timeStr.match(timePattern);
    
    if (!dayMatch || !timeMatch) return null;
    
    const days = dayMatch[0].split('');
    const startHour = parseInt(timeMatch[1]);
    const startMin = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const endHour = timeMatch[3] ? parseInt(timeMatch[3]) : startHour + 1;
    const endMin = timeMatch[4] ? parseInt(timeMatch[4]) : 0;
    
    return {
      days: days,
      startTime: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
      endTime: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
    };
  }

  static parseMITCourse(courseText) {
    const courses = [];
    const consultDept = [];
    const lines = courseText.split('\n');
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Match course codes like "1.00", "18.05", "6.S056", "1.010A"
      const courseCodeMatch = line.match(/^(\d+\.\w+(?:\.\w+)?)/);
      
      if (courseCodeMatch) {
        const courseCode = courseCodeMatch[1];
        const courseName = line.substring(courseCode.length).trim();
        
        // Look ahead to check for "Not offered regularly; consult department"
        let isConsultDept = false;
        let fullText = '';
        let meetingTimes = [];
        
        // Scan the next 20 lines for info about this course
        for (let j = i; j < Math.min(i + 20, lines.length); j++) {
          const currentLine = lines[j];
          fullText += currentLine + '\n';
          
          // Check for "consult department"
          if (currentLine.includes('Not offered regularly; consult department') ||
              currentLine.includes('consult department')) {
            isConsultDept = true;
          }
          
          // Look for lecture times: "Lecture: MW9.30-11 (1-390)"
          if (currentLine.includes('Lecture:') || currentLine.includes('**Lecture:**')) {
            // Extract time patterns like "MW9.30-11", "TR3-4.30", "F9-11"
            const timeMatches = currentLine.matchAll(/([MTWRF]+\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)/g);
            for (const match of timeMatches) {
              const parsed = CourseParser.parseTime(match[1]);
              if (parsed) {
                meetingTimes.push(parsed);
              }
            }
          }
          
          // Stop when we hit the next course
          if (j > i && lines[j].match(/^\d+\.\w+/)) {
            break;
          }
        }
        
        if (isConsultDept) {
          consultDept.push({ 
            code: courseCode, 
            name: courseName, 
            fullText: fullText.trim() 
          });
        } else if (meetingTimes.length > 0) {
          courses.push({
            code: courseCode,
            name: courseName,
            meetingTimes: meetingTimes,
            source: 'MIT',
            fullText: fullText.trim()
          });
        }
      }
      i++;
    }
    
    return { courses, consultDept };
  }

  static parseWellesleyCourse(courseText) {
    const courses = [];
    const consultDept = [];
    const lines = courseText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.includes('INPUT_WELLESLEY')) continue;
      
      // Parse format: "AFR 205 - 01 MR - 9:55 AM - 11:10 AM; ..."
      const match = line.match(/^([A-Z]+\s+\d+)\s+-\s+\d+\s+([MTWRF]+)\s+-\s+(\d{1,2}:\d{2}\s+[AP]M)\s+-\s+(\d{1,2}:\d{2}\s+[AP]M);/);
      
      if (match) {
        const courseCode = match[1];
        const days = match[2];
        const startTime = match[3];
        const endTime = match[4];
        
        // Extract course name from next line
        let courseName = '';
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const nameMatch = nextLine.match(/^(.+?)(?:\s+[A-Z\s]+)?$/);
          if (nameMatch) {
            courseName = nameMatch[1].trim();
          }
        }
        
        // Convert 12-hour to 24-hour format
        const convertTo24 = (time12h) => {
          const [time, period] = time12h.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        };
        
        const parsedDays = days.split('');
        
        const isConsultDept = line.toLowerCase().includes('consult department') || 
                             line.toLowerCase().includes('not offered regularly');
        
        const courseData = {
          code: courseCode,
          name: courseName || courseCode,
          meetingTimes: [{
            days: parsedDays,
            startTime: convertTo24(startTime),
            endTime: convertTo24(endTime)
          }],
          source: 'Wellesley',
          fullText: line + (courseName ? '\n' + courseName : '')
        };
        
        if (isConsultDept) {
          consultDept.push(courseData);
        } else {
          courses.push(courseData);
        }
      }
    }
    
    return { courses, consultDept };
  }
}
