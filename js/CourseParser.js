// CourseParser.js - Handles parsing of course catalogs
class CourseParser {
  static parseTime(timeStr) {
    const dayPattern = /[MTWRF]+/;
    const timePattern = /(\d{1,2})(?:\.(\d{2}))?(?:-(\d{1,2})(?:\.(\d{2}))?)?/;
    
    const dayMatch = timeStr.match(dayPattern);
    const timeMatch = timeStr.match(timePattern);
    
    if (!dayMatch || !timeMatch) return null;
    
    const days = dayMatch[0].split('').map(d => d === 'R' ? 'R' : d);
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
      const line = lines[i];
      const courseCodeMatch = line.match(/^(\d+\.\w+)/);
      
      if (courseCodeMatch) {
        const courseCode = courseCodeMatch[1];
        const courseName = line.substring(courseCode.length).trim();
        
        let isConsultDept = false;
        let fullText = '';
        for (let j = i; j < Math.min(i + 15, lines.length); j++) {
          fullText += lines[j] + '\n';
          if (lines[j].includes('Not offered regularly; consult department')) {
            isConsultDept = true;
          }
        }
        
        if (isConsultDept) {
          consultDept.push({ code: courseCode, name: courseName, fullText });
          i++;
          continue;
        }
        
        let meetingTimes = [];
        for (let j = i; j < Math.min(i + 10, lines.length); j++) {
          const timeLine = lines[j];
          if (timeLine.includes('Lecture:')) {
            const matches = timeLine.matchAll(/([MTWRF]+[\d\.\-:]+)/g);
            for (const match of matches) {
              const parsed = CourseParser.parseTime(match[1]);
              if (parsed) meetingTimes.push(parsed);
            }
          }
        }
        
        if (meetingTimes.length > 0) {
          courses.push({
            code: courseCode,
            name: courseName,
            meetingTimes: meetingTimes,
            source: 'MIT',
            fullText: fullText
          });
        }
      }
      i++;
    }
    
    return { courses, consultDept };
  }

  static parseWellesleyCourse(courseText) {
    const courses = [];
    const lines = courseText.split('\n');
    
    for (let line of lines) {
      if (line.trim().length > 0 && !line.includes('INPUT_WELLESLEY')) {
        const match = line.match(/^([\w\s]+?)\s+([MTWRF]+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
        if (match) {
          courses.push({
            code: '',
            name: match[1].trim(),
            meetingTimes: [{
              days: match[2].split(''),
              startTime: match[3],
              endTime: match[4]
            }],
            source: 'Wellesley',
            fullText: line
          });
        }
      }
    }
    
    return { courses, consultDept: [] };
  }
}
