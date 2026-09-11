// Hand-written EN/ID visitor messages, grouped by intent. These are evaluation
// data, never imported by the production filter. Context cases test ellipsis.
const lines = value => value.trim().split('\n').map(message => message.trim());
const groups = {
  'en-introductions': lines(`
whats this
what's this
what’s this
whats this about
what is this
what event is this
what's the event about ?
hi what's this
hi whats this
hey, what is this website?
hello
hi
hey
heyy
good morning
good afternoon
good evening
hello there
hi astra
are you there
can you help me
help
what can you do
who are you
what is The Premiere
tell me about premiere
what does astra aeterna mean
is this a school event
what is this site for
tell me more
can I ask something
I need some info
give me a quick overview
explain this please
whats happening here
what's going on here
can u explain this
what do you guys do
what is the purpose of this event
who is organizing this
is this run by students
is this for students only
which school hosts this
is this the official website
how does this work
where do I start
I'm new here
what should I know
what activities are there
give me the basics
`),
  'en-registration': lines(`
register
registration
how do i sign up
where can I register
can I join
how do I join
can my school participate
is registration open yet
when does registration close
what's the deadline
how much is registration
do I need a team
can I register individually
where is the sign up form
send me the registration link
what documents do I need
can I join two competitions
can students from other schools join
is there an age limit
which grades can participate
is this open to middle school
can high school students enter
can elementary students join
can alumni participate
do I need a student card
can my teacher register our team
how many people per team
can I change my team members
what if someone on my team is absent
is there a waiting list
can I cancel my registration
can I get a refund
how do I pay
is bank transfer accepted
can I pay by QRIS
where do I send payment proof
how do I know I am registered
I didn't receive a confirmation
the registration form won't open
the link isn't working
can you help with my registration
can I update my details
I put the wrong school name
is parent permission needed
do teams need a coach
can mixed school teams join
how much does it cost
are there any fees
is it free
what are the requirements
`),
  'en-competitions': lines(`
competitions
futsal
basketball
volleyball
badminton
mural
vocal
band
modern dance
speedcubing
swimming
english debate
english speech
what competitions are available
list all the competitions
what are the futsal rules
is basketball for boys and girls
how many volleyball substitutes are allowed
is badminton singles or doubles
what is the mural theme
can I sing an Indonesian song
how many members can a band have
what is the dance time limit
which cubes can I use
which swimming distances are offered
what debate format do you use
what is the speech topic
are there prizes
do winners get trophies
do participants get certificates
where can I find the rulebook
are the rules out yet
when is the technical meeting
will there be a match draw
where can I see the brackets
how long is each match
can we bring our own equipment
is there a dress code for players
what uniform should we wear
can a player enter more than one sport
is there a girls division
is there a boys division
what age groups are allowed
are there individual events
are there team events
do you have an art competition
are music contests included
are there any language competitions
how are the winners selected
where will the competition results be posted
`),
  'en-sponsors-tickets': lines(`
sponsor
sponsorship
I'd like to sponsor
how can our company help
what sponsor packages are available
can I see the sponsorship proposal
send me the sponsor PDF
is there an English proposal
do you have an Indonesian proposal
how much does sponsorship cost
what benefits do sponsors get
where will our logo appear
can we set up a booth
do you accept product donations
can we provide food for the event
who handles sponsorship
can I contact the sponsor team
is a custom partnership possible
can a small business sponsor
who sponsored last year
when is the sponsorship deadline
can I become a media partner
do you need volunteers
can we collaborate
who can I discuss a partnership with
tickets
closing night
when is closing night
who is performing
who are the guest stars
are the artists announced yet
when do tickets go on sale
how much are tickets
where can I buy tickets
is closing night open to the public
can parents attend
can I bring a friend
will there be a concert
is there an early bird price
can I buy tickets at the door
are there VIP tickets
what time do doors open
is merchandise available
merch
can I buy a shirt
what sizes are available
how do I order merchandise
is there a merch catalogue
can I collect my order at school
can merchandise be delivered
`),
  'en-logistics-followups': lines(`
when is it
where is it
what time does it start
how long does it run
what are the dates
is it in February
what year is this for
where is the venue
what's the address
can you send the location
is there a map
how do I get there
is parking available
where can I be dropped off
can I use public transport
is there food available
are drinks allowed
can I bring my own food
where are the toilets
is the venue wheelchair accessible
is there a first aid station
will security be present
what should I bring
what if it rains
is the event indoors
can spectators watch the matches
what time is the opening ceremony
what are the preopening dates
when does premiere week start
can I see the full schedule
who can I contact
can I get the WhatsApp number
can I talk to Gavynn
how do I contact Grace
what is your Instagram
and the price?
what about the girls?
how about for grade 10?
can you explain that again
what does that mean
more details please
in Indonesian please
EN
ID
please answer in English
thanks
thank you
okay got it
yes please
no thanks
`),
  'id-introductions': lines(`
ini apa
ini apaan
ini tentang apa
acara apa ini
ini acara apa sih
halo ini apa
hai ini apaan ya
ini website apa
ini buat apa
The Premiere itu apa
premiere apaan
astra aeterna artinya apa
boleh jelasin acaranya
mau tanya dong
bisa bantu aku
tolong jelaskan
ada orang
halo
hai
hey kak
pagi
selamat pagi
selamat siang
selamat sore
selamat malam
permisi
hai astra
kamu siapa
kamu bisa bantu apa
aku baru buka web ini
kasih ringkasan dong
boleh minta info
informasinya dong
ini kegiatan sekolah ya
sekolah mana yang ngadain
siapa penyelenggaranya
ini diurus sama murid
acaranya untuk siapa
cuma buat anak sekolah
boleh ikut dari luar sekolah
ini website resmi kan
gimana cara kerjanya
mulainya dari mana
ada kegiatan apa aja
tujuan acaranya apa
boleh cerita sedikit
jelasin singkat aja
aku penasaran sama acara ini
aku belum paham
info dong kak
`),
  'id-registration': lines(`
daftar
pendaftaran
gimana cara daftar
daftarnya dimana
aku bisa ikut ga
boleh ikutan
sekolahku boleh ikut
pendaftaran udah buka
kapan pendaftaran ditutup
deadline daftar kapan
biaya daftarnya berapa
harus punya tim
bisa daftar sendiri
formulirnya mana
minta link daftar dong
dokumen apa yang dibutuhkan
bisa ikut dua lomba
siswa sekolah lain boleh ikut
ada batas usia
kelas berapa aja yang boleh
anak SMP bisa ikut
anak SMA boleh daftar
kalau SD boleh ga
alumni boleh ikut
perlu kartu pelajar
guru boleh daftarin tim kami
satu tim berapa orang
bisa ganti anggota tim
kalau anggota tim berhalangan gimana
ada daftar tunggu
bisa batalin pendaftaran
bisa refund ga
bayarnya gimana
bisa transfer bank
bisa pakai QRIS
bukti bayar dikirim kemana
gimana tau udah terdaftar
belum dapet konfirmasi
form pendaftaran gabisa dibuka
linknya error
bantu pendaftaran dong
bisa ubah data
aku salah isi nama sekolah
perlu izin orang tua
tim harus bawa pelatih
bisa tim campur sekolah
berapa harganya
ada biaya tambahan
gratis nggak
persyaratannya apa
`),
  'id-competitions': lines(`
lomba
kompetisi
futsal dong
basket
voli
bulu tangkis
mural dong
vokal
band dong
tari modern
speedcubing dong
renang
debat bahasa inggris
pidato bahasa inggris
ada lomba apa aja
list semua lombanya
aturan futsal gimana
basket ada putra putri
cadangan voli berapa orang
badminton tunggal atau ganda
tema mural apa
boleh nyanyi lagu Indonesia
satu band maksimal berapa orang
batas durasi dance berapa
rubik yang boleh dipakai apa
renangnya jarak berapa
format debat apa
tema pidato apa
hadiahnya apa
pemenang dapet piala
peserta dapet sertifikat
rulebooknya dimana
peraturan udah keluar
technical meeting kapan
pengundian pertandingan kapan
bagan pertandingan lihat dimana
satu pertandingan berapa lama
boleh bawa alat sendiri
pemain harus pakai baju apa
seragamnya harus gimana
bisa ikut lebih dari satu olahraga
ada kategori putri
ada kategori putra
kelompok umurnya berapa
ada lomba individu
ada lomba tim
ada lomba seni
ada lomba musik
penilaiannya gimana
hasil lomba diumumin dimana
`),
  'id-sponsors-tickets': lines(`
mau jadi sponsor
sponsornya gimana
perusahaan kami mau bantu
ada paket sponsor apa
boleh lihat proposal
minta PDF sponsorship
ada proposal bahasa Inggris
ada proposal bahasa Indonesia
biaya sponsorship berapa
benefit sponsor apa
logo kami dipasang dimana
bisa buka booth
bisa sponsor berupa barang
bisa donasi makanan untuk acara
siapa yang urus sponsor
kontak tim sponsor dong
bisa kerja sama khusus
UMKM boleh jadi sponsor
sponsor tahun lalu siapa aja
deadline sponsor kapan
bisa jadi media partner
butuh relawan ga
bisa kolaborasi
mau bahas partnership
ada slot sponsor tersisa
tiket
malam penutupan
kapan closing night
siapa yang tampil
bintang tamunya siapa
artisnya udah diumumin
kapan tiket dijual
harga tiket berapa
beli tiket dimana
closing night terbuka untuk umum
orang tua boleh datang
bisa ajak teman
bakal ada konser
ada harga early bird
bisa beli tiket di tempat
ada tiket VIP
pintu dibuka jam berapa
merchandise udah tersedia
merchnya apa aja
bisa beli kaos
ada ukuran apa aja
gimana pesan merchandise
ada katalog merch
pesanan bisa diambil di sekolah
merchandise bisa dikirim
`),
  'id-logistics-followups': lines(`
kapan acaranya
lokasinya dimana
mulai jam berapa
selesai jam berapa
tanggal berapa aja
ini bulan Februari kan
ini untuk tahun berapa
tempatnya dimana
alamat lengkapnya apa
kirim lokasinya dong
ada peta lokasi
cara kesananya gimana
ada tempat parkir
drop off dimana
bisa naik transportasi umum
ada makanan disana
boleh bawa minuman
boleh bawa makanan sendiri
toiletnya dimana
bisa akses kursi roda
ada petugas P3K
ada keamanan
harus bawa apa
kalau hujan gimana
acaranya indoor
penonton boleh nonton pertandingan
upacara pembukaan jam berapa
tanggal preopening kapan
premiere week mulai kapan
mau lihat jadwal lengkap
siapa yang bisa dihubungi
minta nomor WhatsApp
boleh ngobrol sama Gavynn
kontak Grace dong
Instagramnya apa
kalau biayanya?
kalau untuk cewek?
kalau kelas 10 gimana?
bisa jelasin lagi
maksudnya gimana
detailnya dong
pakai bahasa Indonesia ya
bahasa Inggris dong
tolong jawab lebih singkat
makasih
terima kasih
oke paham
iya boleh
nggak dulu
terus gimana
`)
};
export const commonPhrases = Object.entries(groups).flatMap(([category, phrases]) => phrases.map(message => ({
  message, category, language: category.startsWith('id-') ? 'id' : 'en',
  // Test these whole categories in both new and ongoing sessions separately.
  context: category.endsWith('followups')
})));
export { groups };
