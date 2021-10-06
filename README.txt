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

To start the program issue the following command:

    npm start

If the scraper fails it is possible to restart the process from a given point. For

    npm start 4



Data Structure
--------------

All data are saved to the ./data/ folder.


References
----------

    [1]: https://www.chmi.cz/
    [2]: https://www.chmi.cz/historicka-data/pocasi/denni-data/Denni-data-dle-z.-123-1998-Sb#

