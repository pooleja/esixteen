21 buy https://mkt.21.co/21dotco/ping21_aggregator/ping21/buypings --data '{"n": 10, "website": "popchest.com"}' --maxprice 30000 -o tmp.json

curl -H "Content-Type: application/json" --data @tmp.json http://www.poolecom.com/upload --header "client: asdfasdf"

rm tmp.json
