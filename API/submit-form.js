// On s'assure que le code est bien exécuté côté serveur
module.exports = async (req, res) => {
    // Vérifier si la méthode est bien POST
    if (req.method !== 'POST') {
        console.error('Erreur: Méthode non autorisée. Seule la méthode POST est acceptée.');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // On s'assure que le corps de la requête est présent
    if (!req.body || !req.body.email) {
        console.error('Erreur: Le corps de la requête est manquant ou l\'e-mail est vide.');
        return res.status(400).json({ message: 'Email is required' });
    }

    const { email } = req.body;
    
    // Validation basique de l'e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.error(`Erreur: Format d'e-mail invalide reçu: ${email}`);
        return res.status(400).json({ message: 'Invalid email format' });
    }

    console.log(`E-mail reçu pour inscription: ${email}`);
    
    // Instructions pour la configuration Firestore :
    // 1. Créez un projet sur Firebase (console.firebase.google.com).
    // 2. Dans 'Project Settings' > 'Service Accounts', générez une nouvelle clé privée.
    // 3. Vous obtiendrez un fichier JSON. Copiez son contenu.
    // 4. Sur Vercel, dans 'Settings' > 'Environment Variables', créez une variable nommée `FIREBASE_SERVICE_ACCOUNT_KEY`
    //    et collez le contenu JSON de votre fichier dans sa valeur.
    
    // Importation dynamique du module 'firebase-admin' pour Vercel
    const admin = require('firebase-admin');

    // Initialisation de Firebase Admin SDK avec la clé de service
    try {
        if (!admin.apps.length) {
            console.log('Tentative d\'initialisation de Firebase Admin SDK.');
            if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                console.error('Erreur: La variable d\'environnement FIREBASE_SERVICE_ACCOUNT_KEY est manquante.');
                return res.status(500).json({ message: 'Firebase service account key is missing.' });
            }
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin SDK initialisé avec succès.');
        } else {
            console.log('Firebase Admin SDK déjà initialisé.');
        }
        
        const db = admin.firestore();

        // Enregistrer l'e-mail dans une collection appelée 'emails'
        await db.collection('emails').add({
            email: email,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`E-mail ${email} enregistré avec succès dans Firestore.`);
        return res.status(200).json({ message: 'Email saved successfully' });
    } catch (error) {
        console.error('Erreur critique lors de la connexion à Firestore ou de la sauvegarde de l\'e-mail:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
