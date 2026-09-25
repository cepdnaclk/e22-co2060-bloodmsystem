---
layout: home
permalink: index.html

# Please update this with your repository name and project title
repository-name: e22-co2060-Blood-Bank-management-System-web-app
title: HopeDrop - Blood Bank Management System
---

[comment]: # "This is the standard layout for the project, but you can clean this and use your own template, and add more information required for your own project"

# HopeDrop - Blood Bank Management System

---

![Project Cover](./data/cover_page.jpg)

## Team
- E/22/032, K. Dulaj Ashen, [e22032@eng.pdn.ac.lk](mailto:e22032@eng.pdn.ac.lk)
- E/22/203, R.M.S.S. Kumara, [e22203@eng.pdn.ac.lk](mailto:e22203@eng.pdn.ac.lk)
- E/22/269, Hasara Panchani, [e22269@eng.pdn.ac.lk](mailto:e22269@eng.pdn.ac.lk)
- E/22/353, Gayasha Sandeepa, [e22353@eng.pdn.ac.lk](mailto:e22353@eng.pdn.ac.lk)

## Table of Contents
1. [Introduction](#introduction)
2. [Solution Architecture](#solution-architecture)
3. [Features](#features)
4. [Technology Stack](#technology-stack)
5. [Links](#links)

---

## Introduction

HopeDrop is a comprehensive web-based Blood Bank Management System designed to streamline blood donation, inventory management, and hospital coordination. The system addresses the critical challenge of blood supply shortages by connecting blood banks, hospitals, donors, and medical professionals through a unified digital platform. It enables real-time blood inventory tracking, efficient donor management, automated camp scheduling, and inter-hospital blood transfer coordination. By digitizing the traditionally manual processes of blood banking, HopeDrop reduces response times during emergencies, minimizes blood wastage, and ensures timely availability of the right blood type for patients in need.

## Solution Architecture

The system follows a three-tier client-server architecture:
- **Frontend**: React.js single-page application
- **Backend**: Node.js/Express.js RESTful API
- **Database**: MongoDB for flexible document storage

Key roles supported: Donors, Lab Technicians, Doctors, Blood Camp Coordinators, Hospital Admins, and System Admins.

## Features

- Real-time blood inventory tracking by blood type and expiry
- Donor registration, scheduling, and history management
- Blood camp organization and volunteer coordination
- Inter-hospital blood transfer requests and approvals
- Doctor and lab technician dashboards for patient requests
- Automated alerts for low stock and expiring units
- Secure role-based access control for all user types

## Technology Stack

- **Frontend**: React.js, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Deployment**: GitHub, Docker

## Links

- [Project Repository](https://github.com/cepdnaclk/{{ page.repository-name }}){:target="_blank"}
- [Project Page](https://cepdnaclk.github.io/{{ page.repository-name}}){:target="_blank"}
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)


[//]: # (Please refer this to learn more about Markdown syntax)
[//]: # (https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
