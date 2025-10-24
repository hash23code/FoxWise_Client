"use client";

import { motion } from "framer-motion";
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
} from "lucide-react";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

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
      title: "Gestion Clients Complète",
      description: "Centralisez toutes les informations de vos clients: coordonnées, secteurs, notes et historique.",
      gradient: "from-blue-600 to-cyan-600",
    },
    {
      icon: Briefcase,
      title: "Suivi des Jobs",
      description: "Suivez tous vos projets et tâches avec statuts, priorités, coûts et assignations.",
      gradient: "from-purple-600 to-pink-600",
    },
    {
      icon: Calendar,
      title: "Calendrier Intégré",
      description: "Planifiez vos rendez-vous et synchronisez-les avec vos clients et jobs.",
      gradient: "from-green-600 to-emerald-600",
    },
    {
      icon: Building2,
      title: "Organisation par Secteurs",
      description: "Classez vos clients par secteurs d&apos;activité pour une meilleure organisation.",
      gradient: "from-orange-600 to-red-600",
    },
    {
      icon: BarChart3,
      title: "Rapports & Analytics",
      description: "Visualisez vos performances avec des tableaux de bord et statistiques en temps réel.",
      gradient: "from-indigo-600 to-purple-600",
    },
    {
      icon: DollarSign,
      title: "Suivi Paiements",
      description: "Gérez les paiements, factures et suivez votre rentabilité par projet.",
      gradient: "from-yellow-600 to-orange-600",
    },
  ];

  const stats = [
    { value: "100%", label: "Gratuit", icon: CheckCircle2 },
    { value: "Cloud", label: "Sécurisé", icon: Shield },
    { value: "∞", label: "Clients", icon: Users },
    { value: "24/7", label: "Accessible", icon: Smartphone }
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
              Gérez Vos Clients
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-amber-400 bg-clip-text text-transparent">
              Comme un Pro
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-5xl mx-auto leading-relaxed"
          >
            La solution complète pour gérer vos clients, jobs, calendrier et paiements.
            Tout en un seul endroit. Simple, puissant, et gratuit.
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
              Commencer Gratuitement
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
              onClick={() => router.push("/dashboard")}
              className="px-10 py-5 rounded-xl border-2 border-orange-500/50 text-orange-300 font-bold text-lg hover:bg-orange-500/10 transition-colors"
            >
              Voir la Démo
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
            <Users className="w-20 h-20 mx-auto mb-6 text-white" />
            <h2 className="text-6xl font-bold mb-6 text-white">
              Prêt à Transformer Votre Gestion Client?
            </h2>
            <p className="text-2xl mb-10 text-orange-100 max-w-3xl mx-auto leading-relaxed">
              Rejoignez des centaines d&apos;entreprises qui gèrent leurs clients intelligemment avec FoxWise Client
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(255, 255, 255, 0.6)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/sign-up")}
              className="px-16 py-6 rounded-2xl bg-white text-orange-600 font-bold text-2xl shadow-2xl hover:shadow-white/50 transition-shadow flex items-center gap-4 mx-auto"
            >
              <Briefcase className="w-8 h-8" />
              Commencer Gratuitement
              <ArrowRight className="w-8 h-8" />
            </motion.button>
            <p className="mt-6 text-orange-100 text-lg">
              Aucune carte de crédit requise • Gratuit pour toujours
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
