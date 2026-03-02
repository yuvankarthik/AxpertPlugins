# AXI Plugin Installation -- Manual Steps

## Overview

After installing the AXI Plugin through AxInstaller, complete the
following manual steps to finish the setup.

------------------------------------------------------------------------

## 1. Copy Required HTML File

-   Copy `maintemplate.html` from `../AxpertPlugins/Axi/HTML`
-   Paste it into `../CustomPages`

------------------------------------------------------------------------

## 2. Copy AppSettings File

-   Copy `Appsettings.ini` from your application's
    `ARMScripts / AxpertWebScript` folder
-   Paste it into `../AxpertPlugins/Axi/AXIAPI`

------------------------------------------------------------------------

## 3. Configure IIS for AXIAPI

-   Manually create a new Site for `AXIAPI` in IIS
-   Create and assign a dedicated Application Pool
-   Ensure proper .NET version and permissions are configured

------------------------------------------------------------------------

## 4. Update Configuration URLs

Update the required API URLs inside: -
`../AxpertPlugins/Axi/AXIAPI/axiConfig.json` -
`../AxpertPlugins/axiConfig.json` Ensure the correct AXIAPI site URL is
configured

------------------------------------------------------------------------

## 5. Add AXI Plugin Page to Axpert Application

-   Manually add the AXI Plugin page to the Axpert Application
-   For AXI command line usage, set the AXI HTML page as the
    MainPageTemplate

------------------------------------------------------------------------

## 6. Configure Application Template Property

After logging into the application: 1. Go to Configuration Properties
under Axpert Developer Options (Dev Options) 2. Set the AXI HTML page
name as the value for the property `ApplicationTemplate`

------------------------------------------------------------------------

## 7. Create or Configure Custom Page

Under Custom Pages: - Create `mainpagetemplate` (or use the same name as
the AXI HTML page specified in the ApplicationTemplate property)

### Alternative Method

-   Copy the AXI `mainpagetemplate` file from the AXI Plugin folder
-   Paste it directly into the `CustomPages` folder

------------------------------------------------------------------------

## Installation Complete

After completing all the above steps, restart IIS (if required) and
verify that the AXI Plugin loads successfully within the application.
