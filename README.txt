Processor of Historic Weather Data from CHMU
============================================

Processor of Historic Weather Data from CHMU provides automation for downloading
and aggregating a climatic data from Czech  Hydrometeorological  Institute  [1].
The  processor  processes  a   data   from   the   daily   reports   page   [2].


Installation
------------

To install the scraper you will need to have node and  npm  programs  installed.
Then navigate  to  the  scraper's  folder  and  issue  the  following  command:

    npm install

Note: The program was developed with node 16.9.


Usage for Data Download
-----------------------

To start the data download issue the following command from project's folder:

    npm run download

The downloader is able to be restarted from a given checkpoint.  The  checkpoint
is identified from the downloader's output.  For example,  to  start  downloader
from the checkpoint no. 4 issue the following command:

    npm run download 4

The downloader will start from the fourth item on the  daily  reports  page [2].
The downloaded data are being saved to the ./data/ folder.


Usage for Data Aggregation
--------------------------

    npm run aggregate


References
----------

    [1]: https://www.chmi.cz/
    [2]: https://www.chmi.cz/historicka-data/pocasi/denni-data/Denni-data-dle-z.-123-1998-Sb#

