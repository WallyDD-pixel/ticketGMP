window.generateFacture = async function(data) {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR');
    doc.setFontSize(18);
    doc.text('Facture de campagne', 20, 20);
    doc.setFontSize(12);
    let y = 35;
    const infos = [
      ['Nom de la campagne', data.nom],
      ['Adresse', data.adresse],
      ['Contact', data.contact],
      ['Email', data.email],
      ['Date de création', data.createdAt],
      ['Début', data.debut],
      ['Durée', data.duree + ' jours'],
      ['Détails', data.details],
      ['Distributeur', data.distributeur],
      ['Partenaire', data.partenaire],
      ['Type', data.localNational],
      ['Nb sociétés Local', data.nbSocieteLocal],
      ['Nb sociétés National', data.nbSocieteNational],
      ['Rémunération Local', data.remunerationLocal],
      ['Rémunération National', data.remunerationNational],
      ['Total Local', data.totalLocal + ' €'],
      ['Total National', data.totalNational + ' €'],
    ];
    infos.forEach(([label, value]) => {
      doc.text(label + ' : ' + value, 20, y);
      y += 8;
    });
    doc.save('facture_' + (data.nom || 'campagne') + '.pdf');
  } catch (e) {
    alert('Erreur lors de la génération de la facture : ' + e.message);
  }
};