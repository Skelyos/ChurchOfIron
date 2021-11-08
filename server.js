function requireHTTPS(req, res, next) {
    // The 'x-forwarded-proto' check is for Heroku
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}

const express = require('express');
const path = require('path');
const app = express();

const distFolder = __dirname + '/dist'
app.use(requireHTTPS);
app.use(express.static(distFolder));

app.get('/*', (req, res) =>
    res.sendFile(path.join(__dirname + '/dist/index.html')),
);

const port = process.env.PORT || 8080
app.listen(port, () => {
    console.log('Server running on localhost ' + port);
});
