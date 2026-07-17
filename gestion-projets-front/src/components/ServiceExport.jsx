import React, { useState } from 'react';
import { Database, Download, FileCode, CheckCircle, Copy } from 'lucide-react';
export default function ServiceExport({ projets = [], taches = [], membres = [] }) {
  const [copie, setCopie] = useState(false);

  const genererExportSQL = () => {
    let sql = `-- ========================================================\n`;
    sql += `-- EXPORT DATABASE MYSQL - PROJET GESTION COLLABORATIVE ODC\n`;
    sql += `-- Date de génération: ${new Date().toLocaleString('fr-FR')}\n`;
    sql += `-- ========================================================\n\n`;

    sql += `CREATE DATABASE IF NOT EXISTS \`odc_projet_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
    sql += `USE \`odc_projet_db\`;\n\n`;

    // Drop tables in order of dependencies
    sql += `DROP TABLE IF EXISTS \`commentaire\`;\n`;
    sql += `DROP TABLE IF EXISTS \`tache\`;\n`;
    sql += `DROP TABLE IF EXISTS \`projet_membre\`;\n`;
    sql += `DROP TABLE IF EXISTS \`projet\`;\n`;
    sql += `DROP TABLE IF EXISTS \`membre\`;\n\n`;

    // Table membre
    sql += `-- Structure de la table \`membre\`\n`;
    sql += `CREATE TABLE \`membre\` (\n`;
    sql += `  \`id\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`nom\` VARCHAR(100) NOT NULL,\n`;
    sql += `  \`prenom\` VARCHAR(100) NOT NULL,\n`;
    sql += `  \`email\` VARCHAR(150) NOT NULL UNIQUE,\n`;
    sql += `  \`role\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`avatar_url\` TEXT,\n`;
    sql += `  PRIMARY KEY (\`id\`)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    sql += `-- Contenu de la table \`membre\`\n`;
    membres.forEach(m => {
      sql += `INSERT INTO \`membre\` (\`id\`, \`nom\`, \`prenom\`, \`email\`, \`role\`, \`avatar_url\`) VALUES (${JSON.stringify(m.id)}, ${JSON.stringify(m.nom)}, ${JSON.stringify(m.prenom)}, ${JSON.stringify(m.email)}, ${JSON.stringify(m.roleGlobal)}, ${JSON.stringify(m.avatarUrl)});\n`;
    });
    sql += `\n`;

    // Table projet
    sql += `-- Structure de la table \`projet\`\n`;
    sql += `CREATE TABLE \`projet\` (\n`;
    sql += `  \`id\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`titre\` VARCHAR(200) NOT NULL,\n`;
    sql += `  \`description\` TEXT,\n`;
    sql += `  \`date_debut\` DATE,\n`;
    sql += `  \`date_fin\` DATE,\n`;
    sql += `  \`statut\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`categorie\` VARCHAR(100),\n`;
    sql += `  PRIMARY KEY (\`id\`)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    sql += `-- Contenu de la table \`projet\`\n`;
    projets.forEach(p => {
      sql += `INSERT INTO \`projet\` (\`id\`, \`titre\`, \`description\`, \`date_debut\`, \`date_fin\`, \`statut\`, \`categorie\`) VALUES (${JSON.stringify(p.id)}, ${JSON.stringify(p.titre)}, ${JSON.stringify(p.description)}, ${JSON.stringify(p.dateDebut)}, ${JSON.stringify(p.dateFin)}, ${JSON.stringify(p.statut)}, ${JSON.stringify(p.categorie)});\n`;
    });
    sql += `\n`;

    // Table projet_membre (Many-to-Many relationship table)
    sql += `-- Structure de la table de jointure \`projet_membre\` (Relation N-N)\n`;
    sql += `CREATE TABLE \`projet_membre\` (\n`;
    sql += `  \`projet_id\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`membre_id\` VARCHAR(50) NOT NULL,\n`;
    sql += `  PRIMARY KEY (\`projet_id\`, \`membre_id\`),\n`;
    sql += `  FOREIGN KEY (\`projet_id\`) REFERENCES \`projet\`(\`id\`) ON DELETE CASCADE,\n`;
    sql += `  FOREIGN KEY (\`membre_id\`) REFERENCES \`membre\`(\`id\`) ON DELETE CASCADE\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    sql += `-- Contenu de la table \`projet_membre\`\n`;
    membres.forEach(m => {
      if (m.projetIds && Array.isArray(m.projetIds)) {
        m.projetIds.forEach(pId => {
          if (projets.some(p => p.id === pId)) {
            sql += `INSERT INTO \`projet_membre\` (\`projet_id\`, \`membre_id\`) VALUES (${JSON.stringify(pId)}, ${JSON.stringify(m.id)});\n`;
          }
        });
      }
    });
    sql += `\n`;

    // Table tache
    sql += `-- Structure de la table \`tache\`\n`;
    sql += `CREATE TABLE \`tache\` (\n`;
    sql += `  \`id\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`projet_id\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`titre\` VARCHAR(200) NOT NULL,\n`;
    sql += `  \`description\` TEXT,\n`;
    sql += `  \`statut\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`priorite\` VARCHAR(50) NOT NULL,\n`;
    sql += `  \`date_echeance\` DATE,\n`;
    sql += `  \`membre_assigne_id\` VARCHAR(50),\n`;
    sql += `  PRIMARY KEY (\`id\`),\n`;
    sql += `  FOREIGN KEY (\`projet_id\`) REFERENCES \`projet\`(\`id\`) ON DELETE CASCADE,\n`;
    sql += `  FOREIGN KEY (\`membre_assigne_id\`) REFERENCES \`membre\`(\`id\`) ON DELETE SET NULL\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    sql += `-- Contenu de la table \`tache\`\n`;
    taches.forEach(t => {
      sql += `INSERT INTO \`tache\` (\`id\`, \`projet_id\`, \`titre\`, \`description\`, \`statut\`, \`priorite\`, \`date_echeance\`, \`membre_assigne_id\`) VALUES (${JSON.stringify(t.id)}, ${JSON.stringify(t.projetId)}, ${JSON.stringify(t.titre)}, ${JSON.stringify(t.description)}, ${JSON.stringify(t.statut)}, ${JSON.stringify(t.priorite)}, ${JSON.stringify(t.dateEcheance)}, ${JSON.stringify(t.membreAssigneId)});\n`;
    });
    sql += `\n`;

    return sql;
  };

  const genererExportJSON = () => {
    const donnees = {
      nomApplication: "Gestion de Projet Collaborative ODC",
      version: "1.0.0",
      dateExportation: new Date().toISOString(),
      projets,
      taches,
      membres
    };
    return JSON.stringify(donnees, null, 2);
  };

  const sqlContent = genererExportSQL();
  const jsonContent = genererExportJSON();

  const telechargerFichier = (contenu, nomFichier, typeMime) => {
    const blob = new Blob([contenu], { type: typeMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copierPressePapier = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-dark d-flex align-items-center gap-2 mb-1">
          <Database size={28} className="text-warning" />
          Exportation de la Base de Données (Livrable ODC)
        </h1>
        <p className="text-secondary mb-0">Générez et téléchargez le script SQL MySQL prêt pour votre soutenance et votre rapport.</p>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card bg-white border border-warning rounded-4 text-dark h-100 p-3 shadow-sm">
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center gap-2 text-warning mb-2">
                  <FileCode size={24} />
                  <h4 className="card-title mb-0 fw-bold text-dark">Script SQL MySQL (`odc_projet_db.sql`)</h4>
                </div>
                <p className="card-text text-secondary fs-7">
                  Fichier d'export contenant la création des tables relationnelles (`projet`, `tache`, `membre`) ainsi que l'insertion de toutes les données actuelles.
                </p>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button 
                  className="btn btn-warning text-dark fw-bold w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  onClick={() => telechargerFichier(sqlContent, 'odc_projet_db.sql', 'text/sql')}
                >
                  <Download size={18} />
                  Télécharger le .SQL
                </button>
                <button 
                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                  onClick={copierPressePapier}
                  title="Copier le code SQL"
                >
                  {copie ? <CheckCircle size={18} className="text-success" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card bg-white border border-primary rounded-4 text-dark h-100 p-3 shadow-sm">
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center gap-2 text-primary mb-2">
                  <Database size={24} />
                  <h4 className="card-title mb-0 fw-bold text-dark">Données JSON Brutes (`donnees_odc.json`)</h4>
                </div>
                <p className="card-text text-secondary fs-7">
                  Exportation complète au format JSON standard pour échange d'API ou sauvegarde rapide du state frontend.
                </p>
              </div>
              <div className="mt-3">
                <button 
                  className="btn btn-primary fw-bold w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  onClick={() => telechargerFichier(jsonContent, 'donnees_odc.json', 'application/json')}
                >
                  <Download size={18} />
                  Télécharger le .JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aperçu du Code SQL */}
      <div className="card bg-white border border-light-subtle rounded-4 text-dark shadow-sm" style={{ overflow: 'hidden' }}>
        <div className="card-header bg-light border-bottom border-light-subtle d-flex justify-content-between align-items-center py-3 rounded-top-4 flex-wrap gap-2">
          <h5 className="mb-0 fs-6 fw-bold text-dark">Aperçu du Script SQL Généré</h5>
          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle text-nowrap">MySQL 8.0 / MariaDB Compatible</span>
        </div>
        <div className="card-body p-0" style={{ overflow: 'hidden' }}>
          <pre className="bg-dark text-warning p-3 mb-0 fs-8 rounded-bottom-4 sql-preview-wrap" style={{ maxHeight: '350px', overflowY: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordWrap: 'break-word', wordBreak: 'break-all', overflowX: 'auto' }}>
            {sqlContent}
          </pre>
        </div>
      </div>
    </div>
  );
}
