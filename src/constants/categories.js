import { Home, Users, Car, CreditCard, User, Coffee, Archive } from 'lucide-react';

export const CARD_OPTIONS = [
    'Efectivo',
    'Oro Banamex',
    'Liverpool',
    'Nu San',
    'Nu Max',
    'Oro BBVA'
];

export const DEFAULT_DESCRIPTIONS = {
    // Hogar
    'Renta': 'Renta',
    'Servicios': 'Luz',
    'Supermercado': 'Supermercado',
    'Mercado': 'Carne',
    'Internet': 'Starlink',
    'Limpieza': 'Sra. Limpieza',

    // Familia
    'Colegiatura': 'Colegiatura Mena',
    'Terapias Max': 'Terapia Sensorial',
    'Ropa familia': 'Ropa',
    'Doctor': 'Pediatra',
    'Neuropediatra': 'Dr Sergio',
    'Lunch Mena': 'Lunch Mena',
    'Pañales': 'Pañales',

    // Transporte
    'Mantenimiento': 'Servicio',
    'Gasolina': 'Gasolina',
    'Seguro auto': 'Seguro Auto',
    'Lavado': 'Lavado Auto',
    'Transporte': 'Transporte publico',

    // Deudas
    'Tarjeta de crédito': 'Tarjeta de crédit',
    'Crédito hipotecario': 'Crédito hipotecario',
    'Crédito personal': 'Crédito personal',
    'Crédito educativo': 'Crédito educativo',
    'Tarjeta departamental': 'Liverpool',

    // Gastos Personales
    'Ropa': 'Ropa',
    'Salon de belleza': 'Manicure',
    'Ferreteria': 'Ferreteria',
    'Maestra Sombra': 'Maestra Sombra',
    'Otros personales': 'Otros',

    // Ocio
    'Cine': 'Cine',
    'Comida Calle': 'Tacos al Pastor',
    'Tienda': 'Nieve de Limon',
    'Streaming': 'Netflix',
    'Regalos': 'Regalo',

    // Otros
    'Gym': 'Gyn',
    'Cursos': 'Platzi'
};

// Using pastel colors: more desaturated and lighter options for dark mode contrast
// We'll use specific tailwind classes for text/bg to achieve "pastel" feel
export const GROUPS = [
    {
        id: 'Hogar',
        label: 'Hogar',
        icon: Home,
        color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30', // Pastel Green
        types: ['Renta', 'Servicios', 'Supermercado', 'Mercado', 'Internet', 'Limpieza']
    },
    {
        id: 'Familia',
        label: 'Familia',
        icon: Users,
        color: 'text-violet-300 bg-violet-500/20 border-violet-500/30', // Pastel Purple
        types: ['Colegiatura', 'Terapias Max', 'Ropa familia', 'Doctor', 'Neuropediatra', 'Lunch Mena', 'Pañales']
    },
    {
        id: 'Transporte',
        label: 'Transporte',
        icon: Car,
        color: 'text-amber-200 bg-amber-500/20 border-amber-500/30', // Pastel Orange/Yellow
        types: ['Mantenimiento', 'Gasolina', 'Seguro auto', 'Lavado', 'Transporte']
    },
    {
        id: 'Deudas',
        label: 'Deudas',
        icon: CreditCard,
        color: 'text-rose-300 bg-rose-500/20 border-rose-500/30', // Pastel Red/Pink
        types: ['Tarjeta de crédito', 'Crédito hipotecario', 'Crédito personal', 'Crédito educativo', 'Tarjeta departamental']
    },
    {
        id: 'Personales',
        label: 'Gastos personales',
        icon: User,
        color: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30', // Pastel Cyan
        types: ['Ropa', 'Salon de belleza', 'Ferreteria', 'Maestra Sombra', 'Otros personales']
    },
    {
        id: 'Ocio',
        label: 'Ocio/Entretenimiento',
        icon: Coffee,
        color: 'text-fuchsia-300 bg-fuchsia-500/20 border-fuchsia-500/30', // Pastel Pink
        types: ['Cine', 'Comida Calle', 'Tienda', 'Streaming', 'Regalos']
    },
    {
        id: 'Otros',
        label: 'Otros',
        icon: Archive,
        color: 'text-slate-300 bg-slate-500/20 border-slate-500/30', // Pastel Gray
        types: ['Gym', 'Revistas', 'Otros', 'Cursos']
    }
];
