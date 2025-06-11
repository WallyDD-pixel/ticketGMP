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