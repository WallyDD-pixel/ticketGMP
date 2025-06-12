const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Config Gmail
const gmailEmail = 'ton.email@gmail.com'; // remplace par ton adresse Gmail
const gmailPassword = 'TON_MDP_APPLICATION'; // mot de passe d’application

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

exports.sendTicketReplyNotification = functions.firestore.onDocumentCreated(
  'tickets/{ticketId}/reponses/{reponseId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return null;
    const reponse = snap.data();
    const ticketId = event.params.ticketId;

    // Récupérer le ticket pour avoir l'email de l'utilisateur
    const ticketRef = admin.firestore().collection('tickets').doc(ticketId);
    const ticketDoc = await ticketRef.get();
    if (!ticketDoc.exists) return null;
    const ticket = ticketDoc.data();

    // Préparer l'email
    const mailOptions = {
      from: `Support GMP <${gmailEmail}>`,
      to: ticket.userEmail, // ou ticket.email selon ton schéma
      subject: `Nouvelle réponse à votre ticket "${ticket.title}"`,
      html: `<p>Bonjour,</p>
             <p>Une nouvelle réponse a été ajoutée à votre ticket : <b>${ticket.title}</b></p>
             <p><b>Réponse :</b><br>${reponse.message || ''}</p>
             <p>Consultez votre espace client pour plus de détails.</p>
             <hr>
             <small>Ce message est automatique, merci de ne pas répondre.</small>`
    };

    try {
      await mailTransport.sendMail(mailOptions);
      console.log('Notification email envoyée à', ticket.userEmail);
    } catch (error) {
      console.error('Erreur envoi email:', error);
    }
    return null;
  }
);

// --- Création d'utilisateur par un admin via requête HTTP sécurisée ---
exports.createUser = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send({ error: "Méthode non autorisée" });
  }

  // Authentification admin via token Firebase
  const idToken = req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
    ? req.headers.authorization.split("Bearer ")[1]
    : null;
  if (!idToken) {
    return res.status(401).send({ error: "Non authentifié" });
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
    // Pour plus de sécurité, tu peux vérifier un custom claim admin ici
    // if (!decodedToken.admin) return res.status(403).send({ error: "Accès refusé" });
  } catch (err) {
    return res.status(401).send({ error: "Token invalide" });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send({ error: "Email et mot de passe requis" });
  }

  try {
    const userRecord = await admin.auth().createUser({ email, password });
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return res.send({ success: true, uid: userRecord.uid });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});