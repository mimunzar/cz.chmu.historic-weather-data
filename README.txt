Analytic Tool for Historic Weather Data from CHMU
=================================================

Analytic Tool for Historic  Weather  Data  from  CHMU  provides  automation  for
downloading and aggregating  a  climatic  data  from  Czech  Hydrometeorological
Institute [1].  The tool works on a  data  from  the  daily  reports  page  [2].


Installation
------------

To install the tool you will need to  have  node  and  npm  programs  installed.
Then  navigate  to  the  project's  folder  and  issue  the  following  command:

    npm install

Note: The program was developed with node 16.9.


Usage for Data Download
-----------------------

To start data download issue the following command from  the  project's  folder:

    npm run download

The download is able to be restarted from a given checkpoint.  The checkpoint is
identified from the program's output.  For example, to  start  downloading  from
the checkpoint no. 4 issue the following command:

    npm run download 4

Downloading will start from the fourth item  on  the  daily  reports  page  [2].
Data are being saved to the ./data/ folder.


Usage for Data Aggregation
--------------------------

    npm run aggregate

    npm run aggregate 4


References
----------

    [1]: https://www.chmi.cz/
    [2]: https://www.chmi.cz/historicka-data/pocasi/denni-data/Denni-data-dle-z.-123-1998-Sb#

