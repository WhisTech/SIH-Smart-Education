import React, { useState, useRef } from 'react';
import { UserCheck, Briefcase, Mail, MapPin, Calendar, Building2, Save, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { OFFICIAL_ROLES } from '../data/seedData';

const PRESET_AVATARS = [
  { label: 'Aditya (Default)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { label: 'Rahul', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Rohan', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Priya', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' },
  { label: 'Ananya', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80' },
];

export default function EmployeeProfileModal({ employee, setEmployee, onClose, lang }) {
  const [formData, setFormData] = useState({
    name: employee.name,
    empId: employee.empId,
    roleId: employee.roleId,
    roleName: employee.roleName,
    service: employee.service,
    department: employee.department,
    experience: employee.experience,
    email: employee.email,
    location: employee.location,
    avatar: employee.avatar
  });

  const fileInputRef = useRef(null);

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const selectedRole = OFFICIAL_ROLES.find(r => r.id === formData.roleId);
    setEmployee(prev => ({
      ...prev,
      ...formData,
      roleName: selectedRole ? selectedRole.name : prev.roleName,
      service: selectedRole ? selectedRole.service : prev.service
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="apple-glass-card max-w-lg w-full p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-[#0C447C] dark:text-blue-400" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {lang === 'hi' ? 'कर्मचारी प्रोफ़ाइल और फ़ोटो संपादित करें' : 'Edit Employee Profile & Photo'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 text-[var(--text-muted)] font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Profile Picture Uploader & Presets */}
        <div className="my-5 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-center gap-4">
          
          <div className="relative group shrink-0">
            <img
              src={formData.avatar}
              alt="Profile"
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#0C447C] shadow-md group-hover:opacity-85 transition-all"
            />
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Upload Custom Photo"
            >
              <Camera className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-1">Upload</span>
            </button>
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">Profile Photo</h4>
              <p className="text-[11px] text-[var(--text-secondary)]">Upload any picture from your PC or choose a preset.</p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="px-2.5 py-1 rounded-lg bg-[#0C447C] text-white text-[10px] font-bold flex items-center gap-1 hover:bg-[#085041] transition-all shadow-sm"
              >
                <Upload className="w-3 h-3" />
                <span>Upload from Computer</span>
              </button>
            </div>

            {/* Quick Avatar Presets */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-1">
              <span className="text-[10px] text-[var(--text-muted)] font-medium mr-1">Presets:</span>
              {PRESET_AVATARS.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset.url}
                  alt={preset.label}
                  onClick={() => setFormData(prev => ({ ...prev, avatar: preset.url }))}
                  className={`w-7 h-7 rounded-full object-cover cursor-pointer hover:scale-110 transition-transform ring-1 ${
                    formData.avatar === preset.url ? 'ring-2 ring-[#BA7517] scale-110' : 'ring-black/10 dark:ring-white/20'
                  }`}
                  title={preset.label}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Profile Information Form */}
        <div className="space-y-3.5 my-4">
          <div>
            <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
              Official Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-xs text-[var(--text-primary)] mt-1 font-medium outline-none focus:border-[#0C447C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                Employee ID
              </label>
              <input
                type="text"
                value={formData.empId}
                onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-xs font-mono text-[var(--text-primary)] mt-1 outline-none focus:border-[#0C447C]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                Official Cadre / Role
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-xs text-[var(--text-primary)] mt-1 font-semibold outline-none cursor-pointer"
              >
                {OFFICIAL_ROLES.map(r => (
                  <option key={r.id} value={r.id} className="dark:bg-[#070B12] text-slate-900 dark:text-slate-100">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
              Department / Division
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-xs text-[var(--text-primary)] mt-1 font-medium outline-none focus:border-[#0C447C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                Experience
              </label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-xs text-[var(--text-primary)] mt-1 font-medium outline-none focus:border-[#0C447C]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-xs text-[var(--text-primary)] mt-1 font-medium outline-none focus:border-[#0C447C]"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/5 dark:border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-black/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="apple-btn-primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-md"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Apply Changes</span>
          </button>
        </div>

      </div>
    </div>
  );
}
