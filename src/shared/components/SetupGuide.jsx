import React from 'react';
import { Link } from 'react-router-dom';

const entEdtImg = '/ent-edt.png';
const icalImg = '/ical.png';
const kronoTutoImg = '/krono-tuto.png';

/**
 * Guide affiché quand l'utilisateur n'a pas de configuration UE
 * (filière/année non supportée pour les notes)
 */
export const GradesSetupGuide = () => (
    <div className="rounded-[28px] bg-surface p-6 space-y-4">
        <div>
            <h3 className="font-display text-[22px]">Configurer vos notes</h3>
            <p className="text-sm text-muted mt-1">Importation des UEs de votre formation</p>
        </div>

        <p className="text-sm">
            Pour importer les UEs et matières de votre formation, envoyez par email le PDF de vos UEs
            (relevé de notes ou maquette) à :
        </p>

        <a
            href="mailto:hugo.saulig@etu.umontpellier.fr?subject=Import UEs Krono"
            className="block text-sm font-semibold text-accent"
        >
            hugo.saulig@etu.umontpellier.fr
        </a>

        <p className="text-xs text-muted">
            Un outil automatique sera bientôt disponible pour simplifier cette étape.
        </p>
    </div>
);

/**
 * Guide affiché quand l'utilisateur n'a pas d'emploi du temps configuré
 */
export const ScheduleSetupGuide = () => (
    <div className="rounded-[28px] bg-surface p-6 space-y-4">
        <div>
            <h3 className="font-display text-[22px]">Configurer votre emploi du temps</h3>
            <p className="text-sm text-muted mt-1">Synchronisez votre planning via iCal</p>
        </div>

        <div className="space-y-4">
            <div className="flex gap-3">
                <span className="font-display text-[13px] shrink-0 w-5">1</span>
                <div className="space-y-2 flex-1">
                    <p className="text-sm font-semibold">Accédez à votre ENT et trouvez votre emploi du temps</p>
                    <img src={entEdtImg} alt="Accéder à l'ENT" className="rounded-[14px] w-full" />
                </div>
            </div>

            <div className="flex gap-3">
                <span className="font-display text-[13px] shrink-0 w-5">2</span>
                <div className="space-y-2 flex-1">
                    <p className="text-sm font-semibold">Copiez le lien iCal de votre emploi du temps</p>
                    <img src={icalImg} alt="Trouver le lien iCal" className="rounded-[14px] w-full" />
                </div>
            </div>

            <div className="flex gap-3">
                <span className="font-display text-[13px] shrink-0 w-5">3</span>
                <div className="space-y-2 flex-1">
                    <p className="text-sm font-semibold">Collez le lien dans vos paramètres de profil</p>
                    <img src={kronoTutoImg} alt="Coller dans le profil" className="rounded-[14px] w-full" />
                </div>
            </div>
        </div>

        <Link
            to="/profile"
            className="block text-center py-3 rounded-full font-semibold"
            style={{ background: 'var(--accent-solid)', color: 'var(--bg)' }}
        >
            Aller dans mes paramètres
        </Link>
    </div>
);
