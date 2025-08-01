import {
    BarChart3,
    BookOpen,
    Calendar,
    Edit3,
    Globe,
    Shield,
    Users
} from "lucide-react";
import React from 'react';

export type UserRole = 'ADMIN' | 'USER';

export interface NavigationItem {
    title: string;
    url: string;
    icon: React.ElementType;
    isActive?: boolean;
    badge?: string;
    items?: {
        title: string;
        url: string;
        badge?: string;
    }[];
}

export interface ProjectItem {
    name: string;
    url: string;
    icon: React.ElementType;
    badge?: string;
}

// ADMIN - Tam yetki
export const adminNavigation: NavigationItem[] = [
    {
        title: "Özet",
        url: "/dashboard",
        icon: BarChart3,
        isActive: true,
        items: [
            {
                title: "Genel Bakış",
                url: "/dashboard",
            }
        ],
    },
    {
        title: "Kullanıcılar",
        url: "/users",
        icon: Users,
        items: [
            {
                title: "Tüm Kullanıcılar",
                url: "/users",
            },
            {
                title: "Yeni Kullanıcı",
                url: "/users/new",
            }
        ],
    },
];

// USER - Sınırlı yetkiler (sadece okuma ve kendi içerikleri)
export const userNavigation: NavigationItem[] = [
    {
        title: "Özet",
        url: "/dashboard",
        icon: BarChart3,
        isActive: true,
        items: [
            {
                title: "Genel Bakış",
                url: "/dashboard",
            },
        ],
    },
    {
        title: "Yazılarım",
        url: "/posts/my",
        icon: Edit3,
        items: [
            {
                title: "Tüm Yazılarım",
                url: "/posts",
            }
        ],
    },
    {
        title: "Profil",
        url: "/profile",
        icon: Users,
        items: [
            {
                title: "Ayarlar",
                url: "/site-settings",
            },
        ],
    },
];

// Projeler - Role göre farklı
export const adminProjects: ProjectItem[] = [
    {
        name: "Site Yönetimi",
        url: "/site-management",
        icon: Globe,
    },
    {
        name: "İstatistikler",
        url: "/analytics",
        icon: BarChart3,
        badge: "Yeni"
    },
    {
        name: "Güvenlik",
        url: "/security",
        icon: Shield,
    },
    {
        name: "API Dokümantasyonu",
        url: "/api-docs",
        icon: BookOpen,
    },
];

export const userProjects: ProjectItem[] = [
    {
        name: "Yazı Takvimi",
        url: "/my-calendar",
        icon: Calendar,
    },
    {
        name: "Yardım",
        url: "/help",
        icon: BookOpen,
    },
];

// Navigation factory function
export function getNavigationByRole(role: UserRole): {
    navigation: NavigationItem[];
    projects: ProjectItem[];
} {
    switch (role) {
        case 'ADMIN':
            return {
                navigation: adminNavigation,
                projects: adminProjects,
            };
        case 'USER':
        default:
            return {
                navigation: userNavigation,
                projects: userProjects,
            };
    }
}
