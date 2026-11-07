'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore'; 
// Si usas dbLite, cambia la importación a: import { doc, setDoc } from 'firebase/firestore/lite';
import { db } from '@/lib/firebaseConfig'; // Ajusta la ruta a tu archivo de configuración de Firebase

export default function DashboardPage() {
  const [formData, setFormData] = useState({
    tag_id: '',
    business_name: '',
    target_url: '',
    mode: 'redirect'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Guarda en la colección 'tags' usando el tag_id como identificador único
      await setDoc(doc(db, 'tags', formData.tag_id), {
        business_name: formData.business_name,
        target_url: formData.target_url,
        mode: formData.mode,
        createdAt: new Date().toISOString()
      });

      setMessage({ type: 'success', text: '¡Tag guardado correctamente en la base de datos!' });
      
      // Limpiar formulario después de guardar
      setFormData({
        tag_id: '',
        business_name: '',
        target_url: '',
        mode: 'redirect'
      });
    } catch (error) {
      console.error("Error al guardar el tag:", error);
      setMessage({ type: 'error', text: 'Error al conectar con la base de datos.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        
        {/* Cabecera del Dashboard */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Panel de Control</h1>
          <p className="text-slate-400 mt-2">Crea o actualiza los chips NFC de GodsTap</p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* ID del Tag */}
              <div>
                <label htmlFor="tag_id" className="block text-sm font-medium text-slate-300 mb-2">
                  ID del Tag (Ej. cliente-01)
                </label>
                <input
                  type="text"
                  id="tag_id"
                  name="tag_id"
                  required
                  value={formData.tag_id}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder="El código único para la URL..."
                />
              </div>

              {/* Nombre del Negocio */}
              <div>
                <label htmlFor="business_name" className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre del Cliente / Negocio
                </label>
                <input
                  type="text"
                  id="business_name"
                  name="business_name"
                  required
                  value={formData.business_name}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder="Ej. Papelería Winnie Pooh"
                />
              </div>

              {/* Enlace Destino */}
              <div>
                <label htmlFor="target_url" className="block text-sm font-medium text-slate-300 mb-2">
                  URL de Destino (Link oficial)
                </label>
                <input
                  type="url"
                  id="target_url"
                  name="target_url"
                  required
                  value={formData.target_url}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder="https://g.page/r/ejemplo/review"
                />
              </div>

              {/* Modo de operación */}
              <div>
                <label htmlFor="mode" className="block text-sm font-medium text-slate-300 mb-2">
                  Modo de Operación
                </label>
                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors appearance-none"
                >
                  <option value="redirect">Redirección Instantánea</option>
                  <option value="microsite">Micrositio GodsTap</option>
                </select>
              </div>

              {/* Mensajes de Alerta */}
              {message.text && (
                <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'bg-red-900/30 border-red-500/50 text-red-400'}`}>
                  {message.text}
                </div>
              )}

              {/* Botón Guardar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Guardar Tag'
                )}
              </button>
              
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
