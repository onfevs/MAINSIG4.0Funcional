import React, { useState, useCallback, memo } from 'react';
import { ShieldCheck, Mountain, MapPin, Database, Award, UserCheck, Layers, Menu, X } from 'lucide-react';
import { UserRole } from '../types/mining';

interface HeaderProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenServices: () => void;
}

const HeaderComponent: React.FC<HeaderProps> = ({ userRole, onRoleChange, onOpenServices }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleRoleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onRoleChange(e.target.value as UserRole);
  }, [onRoleChange]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Mountain className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold tracking-tight text-white">
                  MINERÍA LEGAL <span className="text-amber-400">GIS</span> COLOMBIA
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                  v7.5 PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Evaluación Territorial, Ambiental y Jurídica • ANM AnnA Minería & SINAP
              </p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={onOpenServices}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition"
              title="Ver estado de servicios oficiales ANM y fuentes ambientales"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Servicios ANM (4/4)</span>
            </button>

            {/* Projection indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>CTM12 (EPSG:9377)</span>
            </div>

            {/* Role Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg p-1 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
              <select
                value={userRole}
                onChange={handleRoleChange}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none pr-2 cursor-pointer"
                aria-label="Seleccionar rol de usuario"
              >
                <option value="sig_specialist" className="bg-slate-900 text-slate-100">
                  Especialista SIG
                </option>
                <option value="tenement_specialist" className="bg-slate-900 text-slate-100">
                  Profesional de Tenements
                </option>
                <option value="mining_lawyer" className="bg-slate-900 text-slate-100">
                  Abogado Minero-Ambiental
                </option>
                <option value="admin" className="bg-slate-900 text-slate-100">
                  Administrador del Sistema
                </option>
                <option value="general_user" className="bg-slate-900 text-slate-100">
                  Usuario de Consulta
                </option>
              </select>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={onOpenServices}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-sm text-slate-300 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Database className="w-4 h-4 text-amber-400" />
              <span>Servicios ANM (4/4)</span>
            </button>

            <div className="flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-md bg-slate-800/50 border border-slate-800 text-xs text-slate-400">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>CTM12 (EPSG:9377)</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg p-2 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
              <select
                value={userRole}
                onChange={handleRoleChange}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none pr-2 cursor-pointer flex-1"
                aria-label="Seleccionar rol de usuario"
              >
                <option value="sig_specialist" className="bg-slate-900 text-slate-100">
                  Especialista SIG
                </option>
                <option value="tenement_specialist" className="bg-slate-900 text-slate-100">
                  Profesional de Tenements
                </option>
                <option value="mining_lawyer" className="bg-slate-900 text-slate-100">
                  Abogado Minero-Ambiental
                </option>
                <option value="admin" className="bg-slate-900 text-slate-100">
                  Administrador del Sistema
                </option>
                <option value="general_user" className="bg-slate-900 text-slate-100">
                  Usuario de Consulta
                </option>
              </select>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export const Header = memo(HeaderComponent);
