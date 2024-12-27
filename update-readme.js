const fs = require('fs').promises;
const path = require('path');

async function updateReadme() {
  try {
    console.log('Current working directory:', process.cwd());
    const files = await fs.readdir('.');
    console.log('Files in current directory:', files);

    if (!files.includes('jobs.json') || !files.includes('README.md')) {
      throw new Error('Required files not found in working directory');
    }

    const jobsPath = path.join(process.cwd(), 'jobs.json');
    console.log('Reading jobs from:', jobsPath);
    const jobsData = await fs.readFile(jobsPath, 'utf8');
    
    // Validate JSON
    let jobs;
    try {
      jobs = JSON.parse(jobsData);
      if (!Array.isArray(jobs)) {
        throw new Error('Jobs data is not an array');
      }
    } catch (e) {
      throw new Error(`Failed to parse jobs.json: ${e.message}`);
    }

    let markdownTable = '| Company | Role | Location | Date Applied | Portal |\n';
    markdownTable += '   | ------- | ---- | -------- | ------------ | ------ |\n';
    
    for (const job of jobs) {
      const requiredFields = ['company_name', 'role', 'locations', 'date_applied', 'url', 'company_url'];
      for (const field of requiredFields) {
        if (!job[field]) {
          throw new Error(`Missing required field "${field}" in job for ${job.company_name || 'unknown company'}`);
        }
      }

      markdownTable += `| [${job.company_name}](${job.company_url}) | ${job.role} | ${Array.isArray(job.locations) ? job.locations.join(', ') : job.locations} | ${job.date_applied} | [Portal](${job.url}) |\n`;
    }

    const readmePath = path.join(process.cwd(), 'README.md');
    const readmeContent = await fs.readFile(readmePath, 'utf8');
    
    const startMarker = '<!-- START_TABLE -->';
    const endMarker = '<!-- END_TABLE -->';
    
    const startIndex = readmeContent.indexOf(startMarker);
    const endIndex = readmeContent.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Could not find table markers in README.md');
    }

    const updatedReadme = readmeContent.slice(0, startIndex + startMarker.length) +
      '\n' + markdownTable + '\n' +
      readmeContent.slice(endIndex);

    await fs.writeFile(readmePath, updatedReadme);
    console.log('README.md has been updated successfully');
    
  } catch (error) {
    console.error('Error updating README:', error);
    process.exit(1); // Exit with error code
  }
}

updateReadme();
