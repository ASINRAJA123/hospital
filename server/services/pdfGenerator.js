const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const moment = require('moment');

const calculateAge = (born) => {
    if (!born) return "N/A";
    return moment().diff(moment(born), 'years');
};

const formatDoctorName = (name) => {
    if (!name || !name.trim()) return "N/A";
    name = name.trim().replace(/\b\w/g, l => l.toUpperCase()); // Title Case
    if (!name.toLowerCase().startsWith('dr.')) {
        name = `Dr. ${name}`;
    }
    return name;
};

const formatDate = (dateObj, formatStr = 'MMMM Do, YYYY') => {
    if (!dateObj) return "N/A";
    return moment(dateObj).format(formatStr);
};

const generatePatientReport = async (patient, hospital, history) => {
    try {
        const templatePath = path.join(__dirname, 'report_template.html');
        const templateHtml = fs.readFileSync(templatePath, 'utf-8');

        const latestAppointment = history.length > 0 ? history[0] : null;

        const data = {
            patient,
            hospital,
            history,
            latest_appointment: latestAppointment,
            generated_on: moment().format('MMMM Do, YYYY [at] h:mm A'),
            // Helper functions for the template
            helpers: {
                age: calculateAge,
                doctor_name: formatDoctorName,
                format_date: formatDate,
            }
        };

        const htmlContent = ejs.render(templateHtml, data);

        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Important for production/Docker environments
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '20mm',
                right: '20mm'
            }
        });

        await browser.close();
        return pdfBuffer;

    } catch (error) {
        console.error("Error generating PDF report:", error);
        throw new Error("Could not generate PDF report.");
    }
};

module.exports = { generatePatientReport };