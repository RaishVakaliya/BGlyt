# <p align="center"><img src="apps/mobile/assets/logo.svg" alt="BGlyt Logo" width="220" /></p>

<p align="center">
  <strong>BGlyt - High-Fidelity AI Background Removal Suite</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361dafb" alt="React Native" />
  <img src="https://img.shields.io/badge/expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54" alt="Python" />
  <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/hugging_face-%23FFD21E.svg?style=for-the-badge&logo=huggingface&logoColor=black" alt="Hugging Face" />
</p>

---

## Background of the Application

BGlyt was born out of a desire to create a **completely free, unlimited, and privacy-focused** background removal application. 

Most background removal services on the internet require expensive subscriptions or charge per-image credits. By containerizing a custom, highly optimized open-source machine learning model (`rembg` with the `silueta` ONNX runtime) and hosting it ourselves, BGlyt provides professional-grade background removal directly to users on both mobile (Android/iOS) and web platforms without any paywalls, limits, or advertisement clutter.

### Core Problems Resolved:
- **Cost Barriers**: 100% free background removal without needing costly APIs (like Remove.bg).
- **Platform Portability**: Unified experience across native mobile apps (Expo/React Native) and modern web browsers (React/Next.js).
- **Quality and Detail**: Uses anti-aliased alpha compositing to preserve soft edges (like hair or fur) and outputs clean transparent PNGs.

---

## Technical Architecture & Stack

BGlyt is structured as a monorepo containing three core components:

### 1. Backend API (`/backend`)
- **Language**: Python 3.10 / 3.12
- **Framework**: FastAPI
- **ML Engine**: `rembg` (configured with the lightweight 43MB `silueta` ONNX model)
- **Deployment**: Hosted on Hugging Face Spaces inside a Docker container (always-on, 16GB RAM)

### 2. Mobile App (`/apps/mobile`)
- **Framework**: React Native & Expo (TypeScript)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **UI/UX**: Custom themed layouts with before/after swipe comparison views

### 3. Web App (`/apps/web`)
- **Framework**: Next.js (React 19)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide Icons
- **Deployment**: Hosted on Vercel
