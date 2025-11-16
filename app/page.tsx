"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Users,
  Briefcase,
  Calendar,
  Shield,
  Sparkles,
  ChevronDown,
  Lock,
  CheckCircle2,
  BarChart3,
  Building2,
  DollarSign,
  Smartphone,
  MapPin,
  Navigation,
  Clock,
  UserPlus,
  Zap,
  TrendingUp,
  Check,
  Globe,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: Users,
      title: "Gestion Multi-Tenant",
      description: "Architecture entreprise avec isolation complète des données par compagnie. Chaque entreprise a son propre espace sécurisé.",
      gradient: "from-blue-600 to-cyan-600",
    },
    {
      icon: UserPlus,
      title: "Gestion d'Employés",
      description: "Invitez et gérez vos employés avec un système d'invitation par email. Assignez des rôles et contrôlez les permissions.",
      gradient: "from-purple-600 to-pink-600",
    },
    {
      icon: Navigation,
      title: "GPS 3D Navigation",
      description: "Navigation GPS en temps réel avec mode 3D immersif. Guidez vos employés directement vers leurs jobs avec précision.",
      gradient: "from-green-600 to-emerald-600",
    },
    {
      icon: MapPin,
      title: "Cartes Interactives",
      description: "Visualisez tous vos jobs et clients sur une carte interactive. Planifiez les itinéraires et optimisez les déplacements.",
      gradient: "from-orange-600 to-red-600",
    },
    {
      icon: Clock,
      title: "Suivi du Temps Automatique",
      description: "Le temps de travail est calculé automatiquement à partir du GPS de navigation des employés. Rapports précis et fiables.",
      gradient: "from-indigo-600 to-purple-600",
    },
    {
      icon: BarChart3,
      title: "Rapports Complets",
      description: "Tableaux de bord avancés pour les gestionnaires. Analysez la performance, les temps de travail et la productivité.",
      gradient: "from-yellow-600 to-orange-600",
    },
    {
      icon: Briefcase,
      title: "Deux Applications",
      description: "FoxWise Client pour les gestionnaires et FoxWise Worker pour les employés. Interfaces optimisées pour chaque rôle.",
      gradient: "from-red-600 to-pink-600",
    },
    {
      icon: Building2,
      title: "Organisation par Secteurs",
      description: "Classez vos clients par secteurs géographiques. Assignez des zones à vos employés pour une meilleure efficacité.",
      gradient: "from-cyan-600 to-blue-600",
    },
    {
      icon: DollarSign,
      title: "Gestion Financière",
      description: "Suivez les coûts, revenus et rentabilité par job. Facturez vos clients et gérez les paiements facilement.",
      gradient: "from-green-600 to-teal-600",
    },
  ];

  const stats = [
    { value: "2", label: "Applications", icon: Smartphone },
    { value: "GPS 3D", label: "Navigation", icon: Navigation },
    { value: "Auto", label: "Temps Suivi", icon: Clock },
    { value: "Cloud", label: "Sécurisé", icon: Shield }
  ];

  const pricingPlans = [
    {
      name: "Mensuel",
      price: "$39.99",
      period: "/mois",
      features: [
        "Employés illimités",
        "GPS 3D Navigation",
        "Rapports complets",
        "Support prioritaire",
        "Multi-tenant",
        "Mises à jour incluses"
      ],
      gradient: "from-orange-500 to-red-500",
      popular: false
    },
    {
      name: "Annuel",
      price: "$29.99",
      period: "/mois",
      originalPrice: "$39.99",
      savings: "Économisez 25%",
      features: [
        "Tout du plan mensuel",
        "2 mois gratuits",
        "Accès anticipé aux nouvelles fonctionnalités",
        "Facturation annuelle ($359.88/an)",
        "Support VIP",
        "Garantie satisfaction 30 jours"
      ],
      gradient: "from-cyan-500 to-blue-600",
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-black to-red-900/20" />
        {mounted && (
          <>
            <motion.div
              className="absolute w-96 h-96 bg-orange-500/30 rounded-full blur-3xl"
              animate={{
                x: mousePosition.x - 200,
                y: mousePosition.y - 200,
              }}
              transition={{ type: "spring", damping: 30 }}
            />
            <motion.div
              className="absolute top-20 right-20 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/logo.png"
            alt="FoxWise Client"
            width={180}
            height={60}
            className="object-contain"
            priority
          />
        </motion.div>
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(251, 146, 60, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/sign-in")}
            className="px-6 py-2 rounded-lg border border-orange-500/50 text-orange-300 hover:bg-orange-500/10 transition-colors"
          >
            Connexion
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(251, 146, 60, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/sign-up")}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium shadow-lg shadow-orange-500/50"
          >
            Commencer Gratuitement
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-600/20 via-red-600/20 to-amber-600/20 border border-orange-500/30 mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Briefcase className="w-5 h-5 text-orange-400" />
            </motion.div>
            <span className="text-sm font-semibold bg-gradient-to-r from-orange-400 via-red-400 to-amber-400 bg-clip-text text-transparent">
              Gestion Client Professionnelle
            </span>
            <span className="px-2 py-0.5 bg-orange-400 text-black text-xs font-bold rounded-full">PRO</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-orange-200 to-red-200 bg-clip-text text-transparent">
              Gérez Votre Équipe
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-amber-400 bg-clip-text text-transparent">
              En Temps Réel
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-5xl mx-auto leading-relaxed"
          >
            La plateforme complète pour gérer vos employés, jobs et clients avec GPS 3D,
            suivi automatique du temps de travail et rapports avancés. Deux applications
            dédiées: une pour les gestionnaires, une pour les employés.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(251, 146, 60, 0.8)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/sign-up")}
              className="group px-10 py-5 rounded-xl bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 text-white font-bold text-lg shadow-2xl shadow-orange-500/50 flex items-center gap-3"
            >
              <Users className="w-6 h-6" />
              Commencer Maintenant
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 rounded-xl border-2 border-orange-500/50 text-orange-300 font-bold text-lg hover:bg-orange-500/10 transition-colors"
            >
              <a href="#pricing">Voir les Prix</a>
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16"
          >
            <ChevronDown className="w-10 h-10 mx-auto text-orange-400 animate-bounce" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700"
            >
              <stat.icon className="w-12 h-12 mx-auto mb-4 text-orange-400" />
              <div className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <span className="text-orange-300 font-semibold">Fonctionnalités Complètes</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-red-400 to-amber-400 bg-clip-text text-transparent">
            Tout Ce Dont Vous Avez Besoin
          </h2>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
            Des outils puissants pour gérer votre business efficacement
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 hover:border-orange-500/50 transition-all"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} p-4 mb-6 shadow-lg`}>
                <feature.icon className="w-full h-full text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section className="relative z-10 container mx-auto px-6 py-32 bg-gradient-to-b from-transparent via-orange-900/5 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-6">
            <Lock className="w-5 h-5 text-red-400" />
            <span className="text-red-300 font-semibold">Sécurité Entreprise</span>
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Vos Données Sont Protégées
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto">
            Sécurité de niveau bancaire pour protéger vos informations clients
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/30 hover:border-red-500/60 transition-all"
          >
            <Lock className="w-16 h-16 text-red-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4 text-white">Chiffrement Total</h3>
            <p className="text-gray-300 leading-relaxed">
              Toutes vos données sont chiffrées avec les standards de sécurité bancaire.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -10 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-orange-500/30 hover:border-orange-500/60 transition-all"
          >
            <Shield className="w-16 h-16 text-orange-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4 text-white">Authentification Clerk</h3>
            <p className="text-gray-300 leading-relaxed">
              Authentification enterprise avec OAuth 2.0 et sessions sécurisées.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -10 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-yellow-500/30 hover:border-yellow-500/60 transition-all"
          >
            <Users className="w-16 h-16 text-yellow-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4 text-white">Confidentialité Garantie</h3>
            <p className="text-gray-300 leading-relaxed">
              Vos données vous appartiennent. Conforme RGPD et gestion transparente.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Employee Management Showcase */}
      <motion.section
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 container mx-auto px-6 py-32"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
              <UserPlus className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 font-semibold">Gestion d&apos;Équipe</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Invitez et Gérez Vos Employés
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Envoyez des invitations par email à vos employés. Ils reçoivent un lien sécurisé
              pour télécharger l&apos;application FoxWise Worker et rejoindre votre équipe.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span>Invitations par email avec tokens sécurisés</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span>Gestion des rôles et permissions par employé</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span>Assignation automatique à votre compagnie</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span>Interface distincte pour gestionnaires et employés</span>
              </li>
            </ul>
          </div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 p-8"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold">Nouveau Employé</div>
                  <div className="text-gray-400 text-sm">Invitation envoyée</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Email</span>
                  <span className="text-purple-400">employee@example.com</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Rôle</span>
                  <span className="text-pink-400">Employé</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Statut</span>
                  <span className="text-green-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Actif
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* GPS Navigation Showcase */}
      <motion.section
        initial={{ opacity: 0, x: 100 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 container mx-auto px-6 py-32 bg-gradient-to-b from-transparent via-green-900/5 to-transparent"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="order-2 lg:order-1 relative rounded-3xl overflow-hidden bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 p-8"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">Navigation Active</div>
                    <div className="text-gray-400 text-sm">Mode 3D</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-green-400 text-sm font-semibold">
                  En Route
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Destination</span>
                  <span className="text-green-400">123 Rue Client</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Distance</span>
                  <span className="text-emerald-400">2.4 km</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Temps estimé</span>
                  <span className="text-cyan-400">8 minutes</span>
                </div>
                <div className="mt-4 h-32 bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-16 h-16 text-green-400 animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
              <Navigation className="w-5 h-5 text-green-400" />
              <span className="text-green-300 font-semibold">GPS 3D Navigation</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Navigation Immersive en 3D
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Vos employés bénéficient d&apos;une navigation GPS professionnelle avec vue 3D
              pour se rendre à leurs jobs. Itinéraires optimisés et guidage vocal.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span>Navigation 3D interactive avec Mapbox</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span>Cartes interactives pour visualiser tous les jobs</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span>Itinéraires optimisés en temps réel</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span>Suivi de position en direct pour les gestionnaires</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Time Tracking Showcase */}
      <motion.section
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 container mx-auto px-6 py-32"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-semibold">Suivi Automatique</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Temps de Travail Automatique
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Le temps de travail est calculé automatiquement à partir de la navigation GPS
              des employés. Rapports précis et fiables sans intervention manuelle.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <span>Calcul automatique basé sur le GPS</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <span>Rapports détaillés par employé et par job</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <span>Tableaux de bord pour les gestionnaires</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <span>Export des données pour la paie</span>
              </li>
            </ul>
          </div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 p-8"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold">Rapport Hebdomadaire</div>
                  <div className="text-gray-400 text-sm">Semaine du 11-17 Nov</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Jean Tremblay</span>
                    <span className="text-blue-400 font-semibold">42.5h</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Marie Dubois</span>
                    <span className="text-cyan-400 font-semibold">38.0h</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-cyan-500 to-teal-500 h-2 rounded-full" style={{ width: '76%' }} />
                  </div>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Pierre Gagnon</span>
                    <span className="text-teal-400 font-semibold">40.0h</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-teal-500 to-green-500 h-2 rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 container mx-auto px-6 py-32 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-300 font-semibold">Tarification Simple</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Choisissez Votre Plan
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto">
            Pas de frais cachés. Pas de surprise. Juste des outils puissants pour votre équipe.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`relative p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border-2 ${
                plan.popular ? 'border-cyan-500/50 shadow-2xl shadow-cyan-500/20' : 'border-gray-700'
              } transition-all`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white font-bold text-sm">
                  ⭐ MEILLEURE VALEUR
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                {plan.savings && (
                  <div className="text-green-400 font-semibold mb-4">{plan.savings}</div>
                )}
                <div className="flex items-baseline justify-center gap-2">
                  {plan.originalPrice && (
                    <span className="text-2xl text-gray-500 line-through">{plan.originalPrice}</span>
                  )}
                  <span className={`text-6xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                    {plan.price}
                  </span>
                  <span className="text-gray-400 text-xl">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/sign-up")}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  plan.popular
                    ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg`
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Commencer Maintenant
              </motion.button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* App Availability Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 container mx-auto px-6 py-32"
      >
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 mb-6">
            <Globe className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-semibold">Disponible Partout</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
            Téléchargez Sur Vos Appareils
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            FoxWise Client et FoxWise Worker seront bientôt disponibles sur Google Play Store et Apple App Store
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 flex items-center gap-4 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-400">Bientôt sur</div>
                <div className="text-xl font-bold text-white">Google Play</div>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 flex items-center gap-4 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-400">Bientôt sur</div>
                <div className="text-xl font-bold text-white">App Store</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.01 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 p-16 text-center"
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10">
            <Navigation className="w-20 h-20 mx-auto mb-6 text-white" />
            <h2 className="text-6xl font-bold mb-6 text-white">
              Prêt à Gérer Votre Équipe Comme un Pro?
            </h2>
            <p className="text-2xl mb-10 text-orange-100 max-w-3xl mx-auto leading-relaxed">
              Rejoignez les entreprises qui transforment leur gestion d&apos;équipe avec GPS 3D,
              suivi automatique du temps et rapports avancés
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(255, 255, 255, 0.6)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/sign-up")}
              className="px-16 py-6 rounded-2xl bg-white text-orange-600 font-bold text-2xl shadow-2xl hover:shadow-white/50 transition-shadow flex items-center gap-4 mx-auto"
            >
              <Briefcase className="w-8 h-8" />
              Commencer Maintenant
              <ArrowRight className="w-8 h-8" />
            </motion.button>
            <p className="mt-6 text-orange-100 text-lg">
              Essai gratuit • À partir de $29.99/mois
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-12 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer"
          >
            <Image
              src="/logo.png"
              alt="FoxWise Client"
              width={150}
              height={50}
              className="object-contain"
            />
          </motion.div>
          <div className="flex gap-8 text-gray-400">
            <motion.button
              onClick={() => router.push("/dashboard")}
              whileHover={{ scale: 1.1, color: "#fb923c" }}
              className="hover:text-orange-400 transition-colors"
            >
              Fonctionnalités
            </motion.button>
            <motion.button
              onClick={() => router.push("/sign-up")}
              whileHover={{ scale: 1.1, color: "#fb923c" }}
              className="hover:text-orange-400 transition-colors"
            >
              Commencer
            </motion.button>
          </div>
          <div className="text-gray-500 text-sm">
            © 2025 FoxWise Client. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
