const express = require('express');
const fs = require('fs').promises;
const bodyParser = require('body-parser');
require('dotenv').config();
const { Console } = require('console');
const app = express();
const port = 3000;
const filePath = './datei.json';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());


const authenticate = (req, res, next) => {
   // Überprüfe, ob der Authorization-Header vorhanden ist
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).send('Kein Authorization-Header gefunden.');
  }

  // Überprüfe, ob der Authorization-Header das Bearer-Schema verwendet
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).send('Ungültiges Authorization-Schema.');
  }

  // Extrahiere den Token aus dem Authorization-Header
  const token = tokenParts[1];
  console.log(tokenParts[1])
  // Hier könntest du den Token validieren, z.B. gegen einen gültigen Token
  if (token != process.env.BEARER_TOKEN) {
    return res.status(401).send('Ungültiger Bearer-Token.');
  }

  // Wenn der Token gültig ist, rufe next() auf, um zur nächsten Middleware oder Route fortzufahren
  return next();
};

app.get('/entries', async function (req, res) {
    try {
        var data = await readData();
        res.send(data);
    } catch (err) {
        res.status(500).send('Fehler beim Lesen der Datei');
    }
});

async function createDynamicRoutes() {
    const jsonData = await readData();
    if (jsonData) {
        Object.keys(jsonData).forEach(key => {
            console.log(jsonData[key]);
          app.get(`/${key}`, (req, res) => {
            res.redirect(jsonData[key])
          });
        });
    }
}
createDynamicRoutes();

app.post('/entry', authenticate, async function (req, res) {
    try {
        const jsonData = await readData();
        const {slug, url} = req.body;
        console.log(slug + " " + url);
        jsonData[slug] = url;

        await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
      } catch (error) {
        console.error('Fehler beim Schreiben der Datei:', error);
      }
});

app.delete('/entry/:slug', async (req, res) => {
    try {
        const jsonData = await readData();
        
        if(jsonData[req.params.slug] != null){
            delete jsonData[req.params.slug];

            await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
            console.log(`Eintrag mit der ID ${req.params.slug} wurde aus der Datei gelöscht.`);
        }
      } catch (error) {
        console.error('Fehler beim Löschen des Eintrags aus der Datei:', error);
      }
});
  
async function readData(){
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        console.log('Daten aus der JSON-Datei:', jsonData);
        return jsonData;
    } catch (err) {
        console.error('Fehler beim Lesen oder Parsen der JSON-Datei:', err);
        throw err;  // Re-throw the error so it can be caught in the route handler
    }
}

app.listen(port, () => console.log(`Server listening on port
${port}!`))
