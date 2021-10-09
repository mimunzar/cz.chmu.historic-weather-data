Scraper of Historic Weather Data from CHMU
==========================================

Scraper of Historic Weather Data from CHMU provides automation  for  downloading
a climatic data from  Czech  Hydrometeorological  Institute  [1].   The  scraper
downloads all data from daily reports page [2].


Installation
------------

To install the scraper you will need to have node and  npm  programs  installed.
Then navigate  to  the  scraper's  folder  and  issue  the  following  command:

    npm install

Note: The program was developed with node 16.9.


Usage
-----

To start the program issue the following command from scraper's folder:

    npm start

The scraper is able to be restarted from a given checkpoint.  The checkpoint  is
identified from the scraper's output.  For example, to start  scraper  from  the
checkpoint no. 4 issue the following command:

    npm start -- 4

The scraper will start from the forth  item  on  the  daily  reports  page  [2].
Downloaded data are being saved to the ./data/ folder.


References
----------

    [1]: https://www.chmi.cz/
    [2]: https://www.chmi.cz/historicka-data/pocasi/denni-data/Denni-data-dle-z.-123-1998-Sb#

