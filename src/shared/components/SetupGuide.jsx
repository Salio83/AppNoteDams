import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Calendar, ChevronRight, ExternalLink } from 'lucide-react';
import entEdtImg from '../../../assets/ent-edt.png';
import icalImg from '../../../assets/ical.png';
import kronoTutoImg from '../../../assets/krono-tuto.png';

/**
 * Guide affiché quand l'utilisateur n'a pas de configuration UE
 * (filière/année non supportée pour les notes)
 */
export const GradesSetupGuide = () => (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Configurer vos notes</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Importation des UEs de votre formation</p>
            </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
                Pour importer les UEs et matières de votre formation, envoyez par email le <strong>PDF de vos UEs</strong> (relevé de notes ou maquette) à :
            </p>

            <a
                href="mailto:hugo.saulig@etu.umontpellier.fr?subject=Import UEs Krono"
                className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:shadow-md transition-all group"
            >
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-mono text-sm font-semibold text-indigo-700 dark:text-indigo-300">hugo.saulig@etu.umontpellier.fr</span>
                <ExternalLink className="w-4 h-4 text-indigo-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="shrink-0 mt-0.5">💡</span>
                <span>Un outil automatique sera bientôt disponible pour simplifier cette étape.</span>
            </div>
        </div>
    </div>
);

/**
 * Guide affiché quand l'utilisateur n'a pas d'emploi du temps configuré
 */
export const ScheduleSetupGuide = () => (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Configurer votre emploi du temps</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Synchronisez votre planning via iCal</p>
            </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 space-y-4">
            {/* Étape 1 */}
            <div className="flex gap-3">
                <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Accédez à votre ENT et trouvez votre emploi du temps
                    </p>
                    <img src={entEdtImg} alt="Accéder à l'ENT" className="rounded-xl border border-slate-200 dark:border-slate-600 w-full" />
                </div>
            </div>

            {/* Étape 2 */}
            <div className="flex gap-3">
                <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Copiez le lien iCal de votre emploi du temps
                    </p>
                    <img src={icalImg} alt="Trouver le lien iCal" className="rounded-xl border border-slate-200 dark:border-slate-600 w-full" />
                </div>
            </div>

            {/* Étape 3 */}
            <div className="flex gap-3">
                <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">3</span>
                </div>
                <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Collez le lien dans vos paramètres de profil
                    </p>
                    <img src={kronoTutoImg} alt="Coller dans le profil" className="rounded-xl border border-slate-200 dark:border-slate-600 w-full" />
                </div>
            </div>
        </div>

        <Link
            to="/profile"
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
            Aller dans mes paramètres
            <ChevronRight className="w-4 h-4" />
        </Link>
    </div>
);
