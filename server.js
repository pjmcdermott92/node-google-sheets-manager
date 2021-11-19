if (process.env.NODE_ENV !== 'production') require('dotenv').congif();

const express = require('express');
const { google } = require('googleapis');
const config = require('./config');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const CURRENT_DATE = new Date.now().toLocaleDateString();
const valueInputOption = 'USER_ENTERED';

const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets'
});

const setGoogleClientAuth = async (req, res, next) => {
    const client = await auth.getClient();
    req.googleSheets = google.sheets({ version: 'v4', auth: client });
    next();
};

app.post('/attendance-kiosk/create-rows', setGoogleClientAuth, async (req, res) => {
    const { schoolId, studentFirstName, studentLastName, parentName, homeroom, status, time, description } = req.body;
    const spreadsheetId = config.spreadsheets.kiosk.attendance[schoolId].id;
    const range = 'Sheet1!A:H';
    try {
        if (!studentFirstName || !studentLastName || !parentName || !homeroom || !status || !time || !description) {
            throw new Error('Please fill out all of the required fields first.');
        }
        await req.googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId,
            range,
            valueInputOption,
            resource: {
                values: [ CURRENT_DATE, time, status, studentFirstName, studentLastName, parentName, homeroom, description ]
            }
        });
        res.status(201).json({ success: true, message: 'Thank you. Your input has been recorded.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/satisfaction-survey/create-rows', setGoogleClientAuth, async (req, res) => {
    const {
        contactReason,
        contactMethod,
        responseTime,
        issueKnowledgeRating,
        customerSatisfactionRating,
        timelinessSatisfactionRating,
        treatedRespectfullyRating,
        overallSatisfactionRating,
        supportTicketNumber = 'N/A',
        comments,
        followUpContactName,
        followUpContactDetail
    } = req.body;
    const spreadsheetId = config.spreadsheets.kiosk.survey[customerSatisfaction].id;
    const range = 'Sheet1';
    try {
        if (!contactReason || !contactMethod || !responseTime || !overallSatisfactionRating) throw new Error('Please fill out all required fields first.');
        await req.googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId,
            range,
            valueInputOption,
            resource: {
                values: [
                    CURRENT_DATE,
                    contactReason,
                    contactMethod,
                    issueKnowledgeRating,
                    customerSatisfactionRating,
                    timelinessSatisfactionRating,
                    treatedRespectfullyRating,
                    overallSatisfactionRating,
                    supportTicketNumber,
                    comments,
                    followUpContactName,
                    followUpContactDetail
                ]
            }
        });
        res.status(201).json({ success: true, message: 'Thank you for your feedback! Your submission has been received.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
})

app.listen(process.env.PORT, () => console.log(`App listening on Port ${process.env.PORT}`));
