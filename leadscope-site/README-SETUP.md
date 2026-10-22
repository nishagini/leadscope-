# Leadscope site — form setup

## Step 1: Create the Google Sheet + endpoint (you do this once)

1. Open **https://sheets.new** (logged into your Google account) → name the sheet **Leadscope Leads**
2. Top menu → **Extensions → Apps Script**
3. Select all the default code, delete it, paste the contents of `apps-script/Code.gs`
4. Click **Deploy → New deployment**
5. Click the ⚙ gear icon → choose **Web app**
6. Set:
   - Description: `leadscope leads`
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy** → **Authorize access** → pick your Google account
   - If you see "Google hasn't verified this app": click **Advanced → Go to (project name) → Allow** (it's your own script, this is normal)
8. Copy the **Web app URL** (ends with `/exec`) and send it over

## Step 2: Paste the URL into the site (I do this)

Send me the `/exec` URL — I patch `index.html` (`CONFIG.endpoint`).

## Step 3: Deploy to Netlify

1. In Finder, select the `leadscope-site` folder
2. Netlify dashboard → your site → **Deploys** → drag the folder onto the deploy area
3. Wait for "Published"

## Step 4: Test

- Fill the form on leadscope.in → you should see:
  - a new row in **Leadscope Leads** sheet
  - an email at **manish.k@leadscope.in** with subject `Growth call request: <company>`

## Keep these files in the folder

- `key.txt` — IndexNow key. Search engines (Bing, Yandex) fetch `https://leadscope.in/key.txt`
  to verify the site before accepting URL submissions. If it's deleted, submissions stop working.
- `google2ef58618a85ed8f9.html` — Google Search Console ownership proof.
- `stats/` — private analytics dashboard (`noindex`, not in the sitemap). Don't link to it.

## Daily stats

Open **https://leadscope.in/stats/** for page-view counts (today / 7 days / 30 days / all time).
Data lands in the **Pageviews** tab of the *Leadscope Leads* Google Sheet.

## Updating the Apps Script (stats or lead handling)

1. In the Sheet → **Extensions → Apps Script** → paste the new `apps-script/Code.gs`
2. **Deploy → Manage deployments** → ✎ on the existing row → Version: **New version** → **Deploy**
   (never "+ New deployment" — that creates a new URL and breaks the form)
